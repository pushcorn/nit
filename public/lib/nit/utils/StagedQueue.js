module.exports = function (nit)
{
    return nit.defineClass ("nit.utils.StagedQueue")
        .staticProperty ("stages...", "function")
        .staticProperty ("untils...", "function")
        .field ("args...", "any")
        .field ("owner", "any")
        .field ("result", "any")
        .field ("error", "any")
        .field ("queue", "any")
        .do (function (cls)
        {
            ["init", "success", "failure", "complete"].forEach (function (method)
            {
                var hook = cls.name + "." + method;

                cls.staticLifecycleMethod (method, function (queue)
                {
                    var cls = queue.constructor;

                    return cls.invokeClassChainMethod ([queue, hook], queue.args, true);
                });
            });
        })
        .staticTypedMethod ("createStage",
            {
                name: "string", task: "function"
            },
            function (name, task)
            {
                function stage (queue)
                {
                    return task.apply (queue, queue.args);
                }

                nit.dpv (stage, "needle", function (s) { return s.name == name; });

                return nit.dpv (stage, "name", name);
            }
        )
        .staticMethod ("until", function (condition)
        {
            var cls = this;
            var value = condition;

            condition = nit.is.func (value) ? value : function () { return this.result === value; };

            cls.untils.push (cls.createStage (condition));

            return cls;
        })
        .staticMethod ("lpush", function (stage, task)
        {
            var cls = this;

            cls.stages.unshift (cls.createStage (stage, task));

            return cls;
        })
        .staticMethod ("push", function (stage, task)
        {
            var cls = this;

            cls.stages.push (cls.createStage (stage, task));

            return cls;
        })
        .staticTypedMethod ("before",
            {
                target: "string", stage: "string", task: "function"
            },
            function (target, stage, task)
            {
                var cls = this;
                var st = cls.createStage (stage || target, task);

                if (!nit.insertBefore (cls.stages, st, function (s) { return s.name == target; }))
                {
                    cls.stages.unshift (st);
                }

                return cls;
            }
        )
        .staticTypedMethod ("after",
            {
                target: "string", stage: "string", task: "function"
            },
            function (target, stage, task)
            {
                var cls = this;
                var st = cls.createStage (stage || target, task);

                if (!nit.insertAfter (cls.stages, st, function (s) { return s.name == target; }))
                {
                    cls.stages.push (st);
                }

                return cls;
            }
        )
        .staticTypedMethod ("replace",
            {
                target: "string", task: "function"
            },
            function (target, task)
            {
                var cls = this;
                var st = cls.createStage (target, task);

                if (!nit.arrayReplace (cls.stages, st, function (s) { return s.name == target; }))
                {
                    cls.stages.push (st);
                }

                return cls;
            }
        )
        .staticMethod ("run", function (args, owner)
        {
            return this ({ args: args, owner: owner }).run ();
        })
        .method ("run", function ()
        {
            var queue = this;
            var cls = queue.constructor;
            var nq = nit.Queue ();

            nq.stopOns = cls.untils;

            if (cls[cls.kInit]) { nq.push (cls.init); }
            if (cls[cls.kSuccess]) { nq.success (cls.success); }
            if (cls[cls.kFailure]) { nq.failure (cls.failure); }
            if (cls[cls.kComplete]) { nq.complete (cls.complete); }

            return nq.push (cls.stages).run (queue);
        })
    ;
};

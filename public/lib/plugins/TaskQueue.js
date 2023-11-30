module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("TaskQueue"))
        .use ("nit.utils.TaskQueue")
        .onUsedBy (function (hostClass)
        {
            hostClass
                .property ("taskQueue", "nit.utils.TaskQueue", function () { return new Self.TaskQueue ({ autoStart: true }); })
                .defineInnerClass ("Task", "nit.Task", function (Task)
                {
                    Task
                        .defineMeta ("priority", "integer", 100)
                        .defineMeta ("unique", "boolean")
                        .property ("owner", hostClass.name, { enumerable: false })
                    ;
                })
                .staticMethod ("defineTask", function (name, superclass, builder) // eslint-disable-line no-unused-vars
                {
                    var cfg = nit.typedArgsToObj (arguments,
                    {
                        name: "string",
                        superclass: "string",
                        builder: "function"
                    });

                    return this.defineInnerClass (cfg.name, cfg.superclass || this.Task.name, cfg.builder);
                })
                .staticMethod ("defineTaskMethod", function (name, superclass, builder)
                {
                    var clsName = nit.ucFirst (name) + "MethodTask";

                    return this
                        .defineTask (clsName, superclass, builder)
                        .method (name, function ()
                        {
                            var self = this;
                            var cls = self.constructor;
                            var taskCls = cls[clsName];
                            var task = nit.new (taskCls, arguments);

                            task.owner = self;

                            return nit.invoke.return ([task, "run"], null, function (c) { return c.result; });
                        })
                    ;
                })
                .staticMethod ("defineQueuedTaskMethod", function (name, superclass, builder)
                {
                    var clsName = nit.ucFirst (name) + "MethodTask";

                    return this
                        .defineTask (clsName, superclass, builder)
                        .method (name, function ()
                        {
                            var self = this;
                            var cls = self.constructor;
                            var taskCls = cls[clsName];
                            var task = nit.new (taskCls, arguments);

                            task.owner = self;

                            self.taskQueue.enqueue (task, taskCls.priority, taskCls.unique);

                            return self;
                        })
                    ;
                })
            ;
        })
    ;
};

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
                .staticTypedMethod ("defineTask",
                    {
                        name: "string", superclass: "string", builder: "function"
                    },
                    function (name, superclass, builder) // eslint-disable-line no-unused-vars
                    {
                        return this.defineInnerClass (name, superclass || this.Task.name, builder);
                    }
                )
                .staticMethod ("defineTaskMethod", function (name, superclass, builder)
                {
                    var clsName = nit.ucFirst (name) + "Task";

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
                    var clsName = nit.ucFirst (name) + "Task";

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

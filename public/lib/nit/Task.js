module.exports = function (nit, Self)
{
    var writer = new nit.Object.Property.Writer;

    return (Self = nit.defineClass ("nit.Task"))
        .k ("context")
        .categorize ("tasks")
        .defineMeta ("description", "string", "Task description unavailable.")
        .plugin ("lifecycle-component", "run", "cancel")
        .property ("canceled", "boolean", { enumerable: false, writer: writer })
        .do (function ()
        {
            nit.runTask = function ()
            {
                var args = nit.array (arguments);
                var name = args.shift ();
                var taskClass = nit.lookupComponent (name, "tasks", Self.name);

                return nit.invoke.return ([nit.new (taskClass, args), "run"], [], function (c) { return c.result; });
            };
        })
        .defineInnerClass ("Context", "nit.Context", function (Context)
        {
            Context
                .field ("[parent]", "nit.Context", "The parent context.",
                {
                    onLink: function ()
                    {
                        this.delegateParentProperties ();
                    }
                })
                .field ("result", "any", "The task result.")
                .field ("error", "any", "The task error.")
                .property ("task", "nit.Task")
                .method ("runTask", function (task)
                {
                    return nit.invoke.return ([task, "run"], { parent: this }, function (c) { return c.result; });
                })
            ;
        })
        .staticMethod ("describe", function (description)
        {
            return this.meta ("description", description);
        })
        .staticMethod ("defineContext", function (builder)
        {
            return this.defineInnerClass ("Context", this.superclass.Context.name, builder);
        })
        .onDefineSubclass (function (Subclass)
        {
            Subclass.defineContext ();
        })
        .configureComponentMethod ("run", true, function (Queue, method)
        {
            Queue.after (method + ".invokeHook", method + ".checkResult", function (task, ctx)
            {
                ctx.result = nit.coalesce (this.result, ctx.result);
                this.result = undefined;
            });
        })
        .configureComponentMethod ("cancel", function (Queue)
        {
            Queue
                .onInit (function (task)
                {
                    var canceled = task.canceled;

                    task.canceled = writer.value (true);

                    this.args = task;
                    this.canceled = canceled;
                })
                .until (function () { return this.canceled; })
                .onComplete (function (task) { return task; })
            ;
        })
        .configureComponentMethod ("run", function (Queue)
        {
            Queue
                .onInit (function (task)
                {
                    var cls = task.constructor;
                    var ctx = this.args[0];

                    ctx = ctx instanceof Self.Context ? ctx : cls.Context.new (ctx);
                    ctx.task = task;

                    this.args = ctx;
                })
                .until (function (task) { return task.canceled; })
                .onComplete (function (task, ctx) { return ctx; })
                .onRun (function (nq)
                {
                    nq.complete (nit.invoke.wrap.after ([nq, nq.onComplete], function (e, r, q)
                    {
                        let [ctx] = q.args;

                        if ((ctx.error = nit.coalesce (e, q.error)))
                        {
                            nit.dpv (ctx.error, Self.kContext, ctx, true, false);

                            throw ctx.error;
                        }
                    }));
                })
            ;
        })
    ;
};

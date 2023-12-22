module.exports = function (nit, Self)
{
    var writer = new nit.Object.Property.Writer;

    return (Self = nit.defineClass ("nit.Task"))
        .k ("context")
        .categorize ("tasks")
        .defineMeta ("description", "string", "Task description unavailable.")
        .plugin ("lifecycle-component", "run", "catch", "finally", "cancel")
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
        .configureComponentMethods (["run", "catch", "finally"], true, function (Queue, method)
        {
            Queue.after (method + ".invokeHook", method + ".checkResult", function (task, ctx)
            {
                ctx.result = nit.coalesce (this.result, ctx.result);
                this.result = undefined;
            });
        })
        .configureComponentMethods ("cancel", function (Queue)
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
        .configureComponentMethods ("run", function (Queue)
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
                .onFailure (function (task, ctx)
                {
                    ctx.error = this.error;
                    this.error = undefined;

                    return task.catch (ctx);
                })
                .onComplete (function (task, ctx)
                {
                    ctx.error = this.error;

                    return nit.invoke.then ([task, "finally"], ctx, function (error)
                    {
                        ctx.error = nit.coalesce (error, ctx.error);

                        if (ctx.error)
                        {
                            nit.dpv (ctx.error, Self.kContext, ctx, true, false);

                            throw ctx.error;
                        }

                        return ctx;
                    });
                })
            ;
        })
        .onCatch (function (ctx)
        {
            throw ctx.error;
        })
    ;
};

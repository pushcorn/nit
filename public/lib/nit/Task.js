module.exports = function (nit, Self)
{
    var writer = new nit.Object.Property.Writer;


    return (Self = nit.defineClass ("nit.Task"))
        .k ("context")
        .categorize ("tasks")
        .defineMeta ("description", "string", "Task description unavailable.")
        .plugin ("lifecycle-component", "run", "catch", "finally", "cancel")
        .property ("canceled", "boolean", { enumerable: false, writer: writer })
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
        .onInitInvocationQueue (function (queue, comp, method, args)
        {
            queue.after (method + ".invokeHook", method + ".checkResult", function (c)
            {
                if (!~method.toLowerCase ().indexOf ("cancel"))
                {
                    var ctx = args[0];

                    ctx.result = nit.coalesce (c.result, ctx.result);
                    c.result = undefined;
                }
            });
        })
        .onDefineSubclass (function (Subclass)
        {
            Subclass.defineContext ();
        })
        .onListenerError (function (error)
        {
            this.error (error);
        })
        .onConfigureQueueForCancel (function (queue, task, args)
        {
            var canceled = task.canceled;

            task.canceled = writer.value (true);
            args.splice (0, args.length, task);

            queue
                .stopOn (function () { return canceled; })
                .complete (function () { return task; })
            ;
        })
        .onConfigureQueueForRun (function (queue, task, args)
        {
            var cls = task.constructor;
            var ctx = args[0];

            ctx = ctx instanceof Self.Context ? ctx : cls.Context.new (ctx);
            ctx.task = task;
            args.splice (0, args.length, ctx);

            queue
                .stopOn (function () { return task.canceled; })
                .failure (function (c)
                {
                    ctx.error = c.error;
                    c.error = undefined;

                    return task.catch (ctx);
                })
                .complete (function (c)
                {
                    ctx.error = c.error;

                    return nit.Queue ()
                        .push (task.finally.bind (task, ctx))
                        .complete (function (c)
                        {
                            ctx.error = nit.coalesce (c.error, ctx.error);

                            if (ctx.error)
                            {
                                nit.dpv (ctx.error, Self.kContext, ctx, true, false);
                            }

                            return ctx;
                        })
                        .run ()
                    ;
                })
            ;
        })
        .onCatch (function (ctx)
        {
            throw ctx.error;
        })
    ;
};

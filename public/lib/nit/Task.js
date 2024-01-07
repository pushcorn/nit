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
        .configureComponentMethod ("run", true, function (Method, method)
        {
            Method.chains.run.after (method + ".invokeHook", method + ".checkResult", function (task, ctx)
            {
                ctx.result = nit.coalesce (this.result, ctx.result);
                this.result = undefined;
            });
        })
        .configureComponentMethod ("cancel", function (Method)
        {
            Method
                .until (function (task) { return task.canceled; })
                .beforeCancel ("init", function (task)
                {
                    this.args = task;
                    this.canceled = true;
                })
                .afterComplete (function (task)
                {
                    if (this.canceled)
                    {
                        task.canceled = writer.value (true);
                    }

                    return task;
                })
            ;
        })
        .configureComponentMethod ("run", function (Method)
        {
            Method
                .until (function (task) { return task.canceled; })
                .beforeRun ("initArgs", function (task)
                {
                    var cls = task.constructor;
                    var ctx = this.args[0];

                    ctx = ctx instanceof cls.Context ? ctx : cls.Context.new (ctx);
                    ctx.task = task;

                    this.args = ctx;
                })
                .afterComplete ("setErrorContext", function (task, ctx)
                {
                    if ((ctx.error = nit.coalesce (this.error, ctx.error)))
                    {
                        nit.dpv (ctx.error, Self.kContext, ctx, true, false);

                        this.error = ctx.error;
                    }

                    return ctx.destroy ();
                })
            ;
        })
    ;
};

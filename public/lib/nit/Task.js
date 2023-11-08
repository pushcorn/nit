module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Task"))
        .categorize ("tasks")
        .k ("context")
        .defineMeta ("description", "string")
        .plugin ("event-emitter", "run", "catch", "finally", { prePost: true, listenerName: "TaskListener" })
        .defineInnerClass ("Context", "nit.Context", function (Context)
        {
            Context
                .field ("result", "any", "The task result.")
                .field ("error", "any", "The task error.")
            ;
        })
        .do (function ()
        {
            ["run", "catch", "finally"].forEach (function (event)
            {
                ["pre", "post", ""].forEach (function (prefix)
                {
                    var method = prefix ? (prefix + nit.ucFirst (event)) : event;

                    Self.lifecycleMethod (method, function (ctx)
                    {
                        var self = this;
                        var cls = self.constructor;
                        var kEvent = nit.k.v (Self, method);

                        return nit.Queue ()
                            .push (function ()
                            {
                                return nit.invoke ([self, cls[kEvent]], ctx);
                            })
                            .push (function (c)
                            {
                                ctx.result = nit.coalesce (c.result, ctx.result);

                                return self.emit (method, ctx);
                            })
                            .run ()
                        ;
                    });
                });
            });
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
        .method ("execute", function (ctx)
        {
            var self = this;
            var cls = self.constructor;

            ctx = ctx instanceof Self.Context ? ctx : cls.Context.new (ctx);

            return nit.Queue ()
                .push (self.preRun.bind (self, ctx))
                .push (self.run.bind (self, ctx))
                .push (self.postRun.bind (self, ctx))
                .failure (function (c)
                {
                    ctx.error = c.error;

                    return nit.Queue ()
                        .push (self.preCatch.bind (self, ctx))
                        .push (self.catch.bind (self, ctx))
                        .push (self.postCatch.bind (self, ctx))
                        .complete (function (c)
                        {
                            ctx.error = c.error;
                        })
                        .run ()
                    ;
                })
                .complete (function ()
                {
                    return nit.Queue ()
                        .push (self.preFinally.bind (self, ctx))
                        .push (self.finally.bind (self, ctx))
                        .push (self.postFinally.bind (self, ctx))
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
                .run ()
            ;
        })
        .onCatch (function (ctx)
        {
            throw ctx.error;
        })
    ;
};

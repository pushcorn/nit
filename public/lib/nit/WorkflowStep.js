module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.WorkflowStep"))
        .k ("config", "constantFields", "initContext", "catchError", "destroyContext")
        .use ("nit.Workflow")
        .use ("nit.WorkflowField")
        .categorize ("workflowsteps")
        .plugin ("lifecycle-component", "run", { prePost: true })
        .do (Self.WorkflowField.applyToClass)
        .registerPlugin ("nit.ServiceProvider", true, true)
        .getter ("type", function ()
        {
            return this.constructor.name;
        })
        .field ("description", "string", "The description about the step.")
        .field ("condition", "boolean", "Whether the step should be run.", true, { exprAllowed: true })
        .field ("vars", "object", "The variables (with their default values) to be declared.", { exprAllowed: true })
        .field ("catch", "nit.WorkflowStep", "The step to handle the error.")
        .field ("exportAs", "string", "Export the output to the parent context to the specified property.", { exprAllowed: true })

        .defineCaster (function (value)
        {
            if (nit.is.str (value))
            {
                value = { type: value };
            }

            if (nit.is.pojo (value))
            {
                try
                {
                    var opts = nit.omit (value, "type");

                    return nit.new (nit.lookupComponent (value.type, "workflowsteps", Self), opts);
                }
                catch (e)
                {
                    throw nit.error.updateMessage (e, e.message + " (Config: " + nit.toJson (value) + ")");
                }
            }

            return value;
        })
        .defineInnerClass ("Context", "nit.Workflow.Subcontext")
        .staticMethod ("defineContext", function (builder)
        {
            return this.defineInnerClass ("Context", this.superclass.Context.name, builder);
        })
        .onDefineSubclass (function (Subclass)
        {
            Subclass.defineContext ();
        })
        .onPreConstruct (function ()
        {
            var self = this;

            if (!self[Self.kConstantFields])
            {
                var cls = self.constructor;
                var rcp = self[Self.kRawConstructorParams];

                nit.dpv (self, Self.kConfig, rcp);
                nit.dpv (self, Self.kConstantFields, nit.each (cls.fields, function (f)
                {
                    var n = f.name;

                    return (n in rcp && !Self.Workflow.isExpr (rcp[n])) ? n : nit.each.SKIP;

                }), true, false);
            }
        })
        .method ("evaluate", function (ctx)
        {
            var self = this;
            var cls = self.constructor;
            var opts = {};
            var step = Object.create (cls.prototype);
            var constantFields = self[Self.kConstantFields];

            nit.dpv (step, Self.WorkflowField.kSet, true, true, false);
            nit.dpv (step, Self.kConstantFields, constantFields, true, false);

            cls.fields.forEach (function (field)
            {
                opts[field.name] = ~constantFields.indexOf (field.name) ? self[field.name] : field.evaluate (self, ctx);
            });

            step = nit.constructObject (cls, step, opts);

            cls.fields.forEach (function (field)
            {
                var ev = self[field.evaluatorProp];

                if (ev)
                {
                    nit.dpv (step, field.evaluatorProp, ev, true, false);
                }
            });

            delete step[Self.WorkflowField.kSet];

            return step;
        })
        .configureComponentMethod ("run", function (Method)
        {
            Method
                .until (function (self, ctx) { return ctx && ctx.canceled; })
                .before (Self.kInitContext, function (self)
                {
                    var cls = self.constructor;
                    var ctx = this.args[0];

                    ctx = cls.Context.new (ctx instanceof Self.Workflow.Context ? { parent: ctx, input: ctx.output } : ctx);
                    ctx.output = nit.coalesce (ctx.output, ctx.input);

                    var step = this.owner = ctx.owner = self.evaluate (ctx);

                    nit.assign (ctx, nit.clone (self.vars));

                    this.args = ctx;

                    if (!step.condition)
                    {
                        this.stop ();
                    }
                })
                .beforeFailure (Self.kCatchError, function (self, ctx)
                {
                    ctx.error = this.error;

                    if (self.catch)
                    {
                        this.error = null;

                        return nit.invoke.return (
                            function () { return self.catch.run (ctx); },
                            [],
                            function (res) { ctx.error = null; return res; }
                        );
                    }
                })
                .afterComplete (Self.kDestroyContext, function (self, ctx)
                {
                    ctx.updateOutput (this.result);

                    if (self.exportAs)
                    {
                        ctx.parent[self.exportAs] = ctx.output;
                    }

                    if ((ctx.error = nit.coalesce (this.error, ctx.error)))
                    {
                        nit.dpv (ctx.error, Self.Workflow.kContext, ctx, true, false);

                        this.error = ctx.error;
                    }

                    return ctx.destroy ();
                })
            ;
        })
    ;
};

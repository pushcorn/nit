module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.WorkflowStep"))
        .k ("config")
        .use ("nit.Workflow")
        .use ("nit.WorkflowField")
        .categorize ("workflowsteps")
        .staticMethod ("field", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            var cls = this;

            nit.new (Self.WorkflowField, arguments).bind (cls.prototype);

            return cls.validatePropertyDeclarations ();
        })
        .field ("description", "string", "The description about the step.")
        .field ("condition", "boolean", "Whether the step should be run.", true, { exprAllowed: true })
        .field ("catch", "nit.WorkflowStep", "The step to handle the error.")

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
                    var step = nit.new (nit.lookupComponent (value.type, "workflowsteps", Self), value);

                    return nit.dpv (step, Self.kConfig, value);
                }
                catch (e)
                {
                    throw nit.error.updateMessage (e, e.message + " (Config: " + nit.toJson (value) + ")");
                }
            }

            return value;
        })
        .method ("evaluate", function (ctx)
        {
            var self = this;

            self.constructor.fields.forEach (function (field)
            {
                field.evaluate (self, ctx);
            });

            return self;
        })
        .lifecycleMethod ("run", true, function (ctx /* the workflow context */)
        {
            var self = this;
            var cls = self.constructor;

            ctx = ctx instanceof Self.Workflow.Context ? ctx : Self.Workflow.Context.new (ctx);

            return nit.Queue ()
                .push (function ()
                {
                    return self.evaluate (ctx);
                })
                .push (function (c)
                {
                    delete c.result;

                    if (self.condition)
                    {
                        return cls[cls.kRun].call (self, ctx);
                    }
                })
                .failure (function (c)
                {
                    if (self.catch)
                    {
                        ctx.error = c.error;

                        return self.catch.run (ctx);
                    }
                    else
                    {
                        nit.dpv (c.error, Self.Workflow.kContext, ctx, true, false);

                        throw c.error;
                    }
                })
                .complete (function (c)
                {
                    if (c.result != ctx)
                    {
                        ctx.output = nit.coalesce (c.result, ctx.output);
                    }

                    return ctx;
                })
                .run ()
            ;
        })
    ;
};

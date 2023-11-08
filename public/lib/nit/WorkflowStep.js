module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.WorkflowStep"))
        .k ("config", "constantFields")
        .use ("nit.Workflow")
        .use ("nit.WorkflowField")
        .categorize ("workflowsteps")
        .staticMethod ("field", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            var cls = this;

            nit.new (Self.WorkflowField, arguments).bind (cls.prototype);

            return cls.validatePropertyDeclarations ();
        })
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
        .lifecycleMethod ("run", true, function (ctx) // The hook method should return the output value.
        {
            ctx = Self.Workflow.Subcontext.new (ctx instanceof Self.Workflow.Context ? { parent: ctx, input: ctx.output } : ctx);
            ctx.output = nit.coalesce (ctx.output, ctx.input);

            var self = this;
            var cls = self.constructor;
            var step = ctx.owner = self.evaluate (ctx);

            nit.assign (ctx, nit.clone (self.vars));

            return nit.Queue ()
                .stopOn (function ()
                {
                    return ctx.canceled;
                })
                .push (function ()
                {
                    if (step.condition)
                    {
                        return cls[cls.kRun].call (step, ctx);
                    }
                })
                .failure (function (c)
                {
                    ctx.error = c.error;

                    if (step.catch)
                    {
                        return step.catch.run (ctx);
                    }
                    else
                    {
                        throw nit.dpv (ctx.error, Self.Workflow.kContext, ctx, true, false);
                    }
                })
                .complete (function (c)
                {
                    ctx.updateOutput (c.result);

                    if (step.exportAs)
                    {
                        ctx.parent[step.exportAs] = ctx.output;
                    }

                    return ctx;
                })
                .run ()
            ;
        })
    ;
};

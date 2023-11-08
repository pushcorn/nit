module.exports = function (nit, Self)
{
    return (Self = nit.defineWorkflowStep ("While"))
        .field ("<steps...>", "nit.WorkflowStep", "The steps that will be performed on each item.")

        .onRun (function (ctx)
        {
            var self = this;
            var first = true;

            function next ()
            {
                if (ctx.canceled)
                {
                    if (ctx.cancelReason instanceof Self.Workflow.Break)
                    {
                        return;
                    }

                    if (ctx.cancelReason instanceof Self.Workflow.Return)
                    {
                        ctx.output = nit.coalesce (ctx.cancelReason.value, ctx.output);

                        return;
                    }

                    if (!(ctx.cancelReason instanceof Self.Workflow.Continue))
                    {
                        return;
                    }

                    ctx.uncancel ();
                }

                if (first)
                {
                    first = false;
                }
                else
                {
                    ctx.input = ctx.output;
                    self = self.evaluate (ctx);
                }

                if (!self.condition)
                {
                    return;
                }

                ctx.off ("cancel");

                return nit.Queue ()
                    .stopOn (function (c)
                    {
                        var control = nit.get (c, "result.output");

                        if (Self.Workflow.isControl (control))
                        {
                            ctx.cancel (control);

                            return true;
                        }
                    })
                    .stopOn (function ()
                    {
                        return ctx.canceled;
                    })
                    .push (self.steps.map (function (step)
                    {
                        return [
                            function () { return step.run ({ parent: ctx, input: ctx.output }); },
                            function (c) { ctx.output = nit.coalesce (c.result.output, ctx.output); }
                        ];
                    }))
                    .success (next)
                    .complete (function ()
                    {
                        return ctx;
                    })
                    .run ()
                ;
            }

            return next ();
            // return nit.Queue ()
                // .push (next)
                // .complete (function ()
                // {
                    // return ctx;
                // })
                // .run ()
            // ;
        })
    ;
};

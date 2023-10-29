module.exports = function (nit, Self)
{
    return (Self = nit.defineWorkflowStep ("ForEach"))
        .field ("<steps...>", "nit.WorkflowStep", "The steps that will be performed on each item.")
        .field ("items...", "any", "The items to be iterated over.", "${input}", { exprAllowed: true }) // eslint-disable-line  no-template-curly-in-string
        .field ("key", "string", "The context property name that will be used to store the key of the item.", "key")
        .field ("value", "string", "The context property name that will be used to store the valule of the item.", "input")
        .field ("concurrency", "integer", "Process <n> items simultaneously.", 1, { exprAllowed: true })
            .constraint ("min", 1)

        .onRun (function (ctx)
        {
            var self = this;
            var entries = nit.entries (self.items);

            if (self.concurrency > 1)
            {
                return self.runInParallelMode (ctx, entries);
            }
            else
            {
                return self.runInSequentialMode (ctx, entries);
            }
        })
        .staticMethod ("handleSequentialCancellation", function (ctx)
        {
            if (ctx.cancelReason instanceof Self.Workflow.Break)
            {
                return true;
            }

            if (ctx.cancelReason instanceof Self.Workflow.Return)
            {
                ctx.output = nit.coalesce (ctx.cancelReason.value, ctx.output);

                return true;
            }

            if (!(ctx.cancelReason instanceof Self.Workflow.Continue))
            {
                return true;
            }

            ctx.uncancel ();
        })
        .staticMethod ("handleParallelCancellation", function ()
        {
            return true;
        })
        .method ("runInSequentialMode", function (ctx, entries)
        {
            return this.runSteps (ctx, entries, Self.handleSequentialCancellation);
        })
        .method ("runInParallelMode", function (ctx, entries)
        {
            var self = this;
            var nexts = [];
            var results = [];
            var errors = [];
            var canceled = false;
            var returned = false;
            var returnValue;

            function next ()
            {
                if (!entries.length || canceled)
                {
                    return;
                }

                var entry = entries.shift ();
                var subctx = new Self.Workflow.Subcontext ({ parent: ctx });

                return nit.Queue ()
                    .stopOn (function ()
                    {
                        return canceled;
                    })
                    .push (function ()
                    {
                        return self.runSteps (subctx, [entry], Self.handleParallelCancellation);
                    })
                    .success (function (c)
                    {
                        if (subctx.canceled)
                        {
                            if (subctx.cancelReason instanceof Self.Workflow.Return)
                            {
                                canceled = true;

                                if (!returned)
                                {
                                    returned = true;
                                    returnValue = subctx.cancelReason.value;
                                }
                            }
                            else
                            if (subctx.cancelReason instanceof Self.Workflow.Break)
                            {
                                canceled = true;
                            }

                            return;
                        }

                        results.push (c.result.output);
                    })
                    .failure (function (c)
                    {
                        errors.push (c.error);
                    })
                    .complete (next)
                    .run ()
                ;
            }

            var concurrency = self.concurrency;

            while (concurrency--)
            {
                nexts.push (next);
            }

            return nit.parallel (nexts)
                .then (function ()
                {
                    if (returned)
                    {
                        ctx.output = returnValue;
                    }
                    else
                    {
                        ctx.output =
                        {
                            results: results,
                            errors: errors
                        };
                    }
                })
            ;
        })
        .method ("runSteps", function (ctx, entries, cancelHandler)
        {
            var self = this;

            function next ()
            {
                if (ctx.canceled && cancelHandler (ctx))
                {
                    return;
                }

                var entry = entries.shift ();

                if (!entry)
                {
                    return;
                }

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
                    .push (self.steps.map (function (step, i)
                    {
                        return [
                            function ()
                            {
                                var c = { parent: ctx };

                                c[self.key] = entry.k;

                                if (i == 0)
                                {
                                    c[self.value] = entry.v;
                                }

                                return step.run (c);
                            }
                            ,
                            function (c)
                            {
                                ctx.output = nit.coalesce (c.result.output, ctx.output);
                            }
                        ];
                    }))
                    .success (next)
                    .run ()
                ;
            }

            return nit.Queue ()
                .push (next)
                .complete (function ()
                {
                    return ctx;
                })
                .run ()
            ;
        })
    ;
};

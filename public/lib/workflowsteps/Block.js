module.exports = function (nit, Self)
{
    return (Self = nit.defineWorkflowStep ("Block"))
        .m ("error.invalid_parallel_step", "The step '%{name}' is not supported in block parallel mode.")
        .use ("workflowsteps.Continue")
        .use ("workflowsteps.Break")
        .use ("workflowsteps.Return")
        .constant ("CONTROL_STEPS", [Self.Continue, Self.Break, Self.Return])
        .field ("<steps...>", "nit.WorkflowStep", "The steps to run.")
        .field ("mode", "string", "The running mode.", "sequential")
            .constraint ("choice", "sequential", "parallel", "all")

        .onRun (function (ctx)
        {
            var self = this;
            var steps = self.steps;
            var mode = self.mode;

            if (mode == "sequential")
            {
                var queue = nit.Queue ()
                    .stopOn (function ()
                    {
                        return ctx.canceled;
                    })
                ;

                steps.forEach (function (step)
                {
                    queue
                        .push (function ()
                        {
                            return step.run (ctx);
                        })
                        .push (function (c)
                        {
                            ctx.output = nit.coalesce (c.result.output, ctx.output);
                        })
                    ;
                });

                return queue.run ();
            }
            else
            {
                var errors = [];
                var results = [];
                var all = mode == "all";

                return Promise
                    .all (steps.map (function (step)
                    {
                        if (~Self.CONTROL_STEPS.indexOf (step.constructor))
                        {
                            self.throw ("error.invalid_parallel_step", { name: step.constructor.simpleName });
                        }

                        return nit.Queue ()
                            .stopOn (function ()
                            {
                                return ctx.canceled;
                            })
                            .push (function ()
                            {
                                return step.run (ctx);
                            })
                            .success (function (c)
                            {
                                results.push (c.result.output);
                            })
                            .failure (function (c)
                            {
                                if (!all)
                                {
                                    ctx.cancel ();

                                    throw c.error;
                                }

                                errors.push (c.error);
                            })
                            .run ()
                        ;
                    }))
                    .then (function ()
                    {
                        ctx.output =
                        {
                            results: results,
                            errors: errors
                        };
                    })
                ;
            }
        })
    ;
};

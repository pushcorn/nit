module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Switch")
        .field ("<steps...>", "nit.WorkflowStep", "The steps to run.")

        .onRun (function (ctx)
        {
            var self = this;
            var queue = nit.Queue ();

            function next ()
            {
                var step = self.steps.shift ();

                if (!step)
                {
                    return;
                }

                queue
                    .push (function ()
                    {
                        return step.run (ctx);
                    })
                    .push (function (c)
                    {
                        if (c.result.owner.condition)
                        {
                            return nit.Queue.STOP;
                        }
                        else
                        {
                            next (); // eslint-disable-line callback-return
                        }
                    })
                ;
            }

            return queue.push (next).run ();
        })
    ;
};

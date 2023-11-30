module.exports = function (nit)
{
    return nit.defineClass ("tasks.Workflow", "nit.Task")
        .require ("nit.Workflow")
        .describe ("Run a workflow.")
        .field ("<workflow>", "workflow", "The name of the workflow.")
        .field ("inputs...", "any", "The workflow input.")
        .onRun (function (ctx)
        {
            var self = this;
            var workflowClass = nit.Workflow.lookup (self.workflow);
            var input = nit.parseKvp (self.inputs);

            return nit.Queue ()
                .push (function ()
                {
                    return (new workflowClass).run ({ input: input, parent: ctx });
                })
                .complete (function (c)
                {
                    c.result = nit.get (c, "result.output");
                })
                .run ()
            ;
        })
    ;
};

module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Workflow")
        .field ("<name>", "string", "The workflow to run.")
        .field ("input", "any", "The workflow input.", "${input}", { exprAllowed: true }) // eslint-disable-line no-template-curly-in-string
        .onRun (function ()
        {
            var self = this;
            var workflowClass = nit.Workflow.lookup (self.name);

            return (new workflowClass).run ({ input: self.input });
        })
    ;
};

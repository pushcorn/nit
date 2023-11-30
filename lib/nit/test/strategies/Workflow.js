module.exports = function (nit, Self)
{
    return (Self = nit.test.defineStrategy ("Workflow"))
        .use ("nit.Workflow")
        .field ("<workflow>", "string", "The workflow to test.")
        .property ("class", "function")
        .property ("object", "nit.Workflow")
        .onConstruct (function (workflow)
        {
            let workflowClass = Self.Workflow.lookup (workflow);

            this.class = workflowClass;
            this.description = this.description || `Workflow: ${workflowClass.name}`;
        })
        .onTestUp (async function ()
        {
            this.object = new this.class;
        })
        .onTest (async function ()
        {
            return await this.object.run (...arguments);
        })
    ;
};

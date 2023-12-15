module.exports = function (nit, Self)
{
    return (Self = nit.test.defineStrategy ("Workflow"))
        .use ("nit.Workflow")
        .field ("<workflow>", "string", "The workflow to test.")
        .field ("context", "nit.Workflow.Context", "The context to use.")

        .property ("class", "function")
        .property ("object", "nit.Workflow")

        .onConstruct (function (workflow)
        {
            let workflowClass = Self.Workflow.lookup (workflow);

            this.class = workflowClass;
            this.description = this.description || `Workflow: ${workflowClass.name}`;
        })
        .onTestUp (function ()
        {
            this.object = new this.class;
            this.context = this.context || Self.Workflow.Context.new (...arguments);
        })
        .onTest (async function ()
        {
            return (await this.object.run (this.context)).output;
        })
    ;
};

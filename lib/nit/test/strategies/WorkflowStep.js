module.exports = function (nit)
{
    return nit.test.defineStrategy ("WorkflowStep")
        .require ("nit.Workflow")
        .field ("<step>", "string", "The step name.")
        .field ("context", "nit.Workflow.Subcontext", "The subcontext to use.")

        .property ("class", "function")
        .property ("object", "nit.WorkflowStep")

        .onConstruct (function (step)
        {
            let cls = nit.lookupComponent (step, "workflowsteps");

            this.class = cls;
            this.description = this.description || `Workflow Step: ${cls.name}`;
        })
        .onTestUp (async function ()
        {
            this.object = await new this.class (...arguments);
        })
        .onTest (async function ()
        {
            return await this.object.run (this.context);
        })
    ;
};

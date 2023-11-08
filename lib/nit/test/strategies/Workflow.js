module.exports = function (nit)
{
    return nit.test.defineStrategy ("Workflow")
        .require ("nit.Workflow")
        .m ("error.workflow_not_found", "The workflow '%{name}' was not found.")
        .field ("<workflow>", "string", "The workflow to test.")

        .property ("class", "function")
        .property ("object", "nit.Workflow")

        .method ("defineWorkflowClass", function (name, descriptor)
        {
            let path = nit.absPath (descriptor?.path || name);

            if (nit.fs.existsSync (path))
            {
                let f = nit.path.parse (path);

                return nit.defineWorkflow (nit.ComponentDescriptor.toClassName ("test:" + f.name, "workflows")).config (nit.require (path));
            }
        })
        .onConstruct (function (workflow)
        {
            let self = this;
            let className = nit.ComponentDescriptor.toClassName (workflow, "workflows");
            let descriptor = nit.find (nit.listComponents ("workflows"), function (d) { return d.name == workflow || d.className == className; });
            let workflowClass = descriptor && descriptor.class || self.defineWorkflowClass (workflow, descriptor);

            if (!workflowClass)
            {
                self.throw ("error.workflow_not_found", { name: workflow });
            }

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

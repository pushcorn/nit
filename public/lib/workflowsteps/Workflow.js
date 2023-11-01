module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Workflow")
        .m ("error.workflow_not_found", "The workflow '%{name}' was not found.")
        .field ("<name>", "string", "The workflow to run.")
        .field ("input", "any", "The workflow input.", "${input}", { exprAllowed: true }) // eslint-disable-line no-template-curly-in-string
        .lifecycleMethod ("defineWorkflowClass", function (name, descriptor)
        {
            var self = this;
            var cls = self.constructor;
            var workflowClass = nit.invoke ([self, cls[cls.kDefineWorkflowClass]], [name, descriptor]);

            if (!workflowClass)
            {
                self.throw ("error.workflow_not_found", { name: name });
            }

            return workflowClass;
        })
        .onRun (function ()
        {
            var self = this;
            var name = self.name;
            var descriptor = nit.find (nit.listComponents ("workflows"), function (d) { return d.name == name || d.className == name; });
            var workflowClass = descriptor && descriptor.class || self.defineWorkflowClass (name, descriptor);

            return (new workflowClass).run ({ input: self.input });
        })
    ;
};

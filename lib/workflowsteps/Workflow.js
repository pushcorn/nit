module.exports = function (nit)
{
    return nit.requireAsset ("public/lib/workflowsteps/Workflow")
        .onDefineWorkflowClass (function (name, descriptor)
        {
            let path = nit.absPath (descriptor?.path || name);

            if (nit.fs.existsSync (path))
            {
                var f = nit.path.parse (path);

                return nit.defineWorkflow (nit.ComponentDescriptor.toClassName (f.name, "workflows")).configure (nit.require (path));
            }
        })
    ;
};
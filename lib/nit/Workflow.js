module.exports = function (nit)
{
    return nit.requireAsset ("public/lib/nit/Workflow")
        .plugin ("compgen-completer")
        .registerStringTypeParser ("workflow")
        .defineCompgenCompleter (Completer =>
        {
            Completer
                .completeForType ("workflow", ctx => [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (nit.listComponents ("workflows", true))])
            ;
        })
        .onDefineWorkflowClass (function (name, descriptor, prefix)
        {
            let path = nit.absPath (descriptor?.path || name);

            if (nit.fs.existsSync (path))
            {
                let f = nit.path.parse (path);

                return nit.defineWorkflow (nit.ComponentDescriptor.toClassName (nit.trim (prefix) + f.name, "workflows")).config (nit.require (path));
            }
        })
    ;
};

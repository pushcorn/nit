module.exports = function (nit, Self)
{
    return (Self = nit.requireAsset ("public/lib/tasks/Workflow"))
        .plugin ("compgen-completer")
        .defineCompgenCompleter (Completer =>
        {
            Completer
                .completeForOption ("commands.Task.inputs", { task: "workflow" }, ctx =>
                {
                    let workflow = ctx.specifiedValues.workflow;
                    let workflowClass = nit.Workflow.lookup (workflow);
                    let options = nit.array (workflowClass.config ().options);
                    let props = options.map (o => Self.Property.new (workflowClass, o));

                    return [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (props.map (p => p.name + "="))];
                })
            ;
        })
    ;
};

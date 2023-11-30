module.exports = function (nit)
{
    return nit.requireAsset ("public/lib/nit/Task")
        .plugin ("compgen-completer")
        .registerStringTypeParser ("task")
        .defineCompgenCompleter (Completer =>
        {
            Completer
                .completeForType ("task", ctx => [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (nit.listComponents ("tasks", true))])
            ;
        })
    ;
};

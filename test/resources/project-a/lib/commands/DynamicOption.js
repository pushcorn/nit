module.exports = function (nit)
{
    return nit.defineCommand ("commands.DynamicOption")
        .describe ("A command for testing dynmaic option generation.")
        .plugin ("compgen-completer")
        .defineInput (function (Input)
        {
            Input
                .option ("<animal>", "string")
                    .constraint ("choice", "bird", "dog")
                .option ("[action]", "string")
            ;
        })
        .defineCompgenCompleter (Completer =>
        {
            Completer
                .completeForOption ("commands.DynamicOption.action", ctx =>
                {
                    let animal = ctx.specifiedValues.animal;

                    if (animal == "bird")
                    {
                        return [nit.Compgen.ACTIONS.VALUE, "fly", "eat"];
                    }
                    else
                    {
                        return [nit.Compgen.ACTIONS.VALUE, "swim", "run"];
                    }
                })
            ;
        })
    ;
};

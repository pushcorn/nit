module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Help"))
        .plugin ("compgen-completer")
        .describe ("Display the help overview or help of a command.")
        .defineInput (Input =>
        {
            Input
                .option ("[command]", "command", "The command name.")
                .option ("[subcommand]", "string", "The subcommand name. (Not supported by all commands.)")
            ;
        })
        .defineCompgenCompleter (Completer =>
        {
            Completer
                .completeForOption (Self.name + ".subcommand", function (ctx)
                {
                    let command = nit.lookupCommand (ctx.specifiedValues.command, true);
                    let opt = command && command.Input.subcommandOption;

                    if (opt)
                    {
                        return [nit.Compgen.ACTIONS.SUBCOMMAND, ...ctx.filterCompletions (opt.class.listSubcommands (true))];
                    }
                })
            ;
        })
        .staticMethod ("help", function ()
        {
            return nit.Command.help.call (this)
                .paragraph ("Available commands:")
                .table (nit.listCommands ()
                    .sort ((a, b) => a.compareTo (b))
                    .map (c => ({ cols: [" " + c.name, nit.trim (c.class.description)] }))
                )
            ;
        })
        .onRun (async function (ctx)
        {
            let { command, subcommand } = ctx.input;
            let cls = command ? await nit.lookupCommand (command) : Self;

            return cls.help (subcommand).build ();
        })
    ;
};

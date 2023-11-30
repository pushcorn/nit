module.exports = function (nit)
{
    return nit.defineClass ("tasks.Command", "nit.Task")
        .describe ("Run a command.")
        .require ("nit.Command")
        .plugin ("compgen-completer")
        .field ("<command>", "command", "The name of the command.")
        .field ("[options...]", "any", "The command input.")
        .field ("subcommandOptions...", "any", "The subcommand options.")
        .defineCompgenCompleter (Completer =>
        {
            Completer
                .completeForOption ("commands.Task.options", { task: "command" }, ctx =>
                {
                    let command = ctx.specifiedValues.command;
                    let commandClass = nit.lookupCommand (command, true);

                    return [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (commandClass?.Input.enumerablePropertyNames.map (n => n + "="))];
                })
            ;
        })
        .onRun (async function ()
        {
            let self = this;
            let command = nit.lookupCommand (self.command);
            let scOpt = command.Input.subcommandOption;
            let input = command.Input.parseArgv (nit.parseKvp (self.options));
            let subcommand;

            if (scOpt && (subcommand = input[scOpt.name]))
            {
                let subcommandClass = scOpt.class.lookup (subcommand);

                input[scOpt.name] = new subcommandClass ({ input: nit.parseKvp (self.subcommandOptions) });
            }

            let context = await new command.Context (command.Input.fromArgv (input));

            return (await command ().run (context)).output;
        })
    ;
};

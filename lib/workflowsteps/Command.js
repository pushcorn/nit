module.exports = function (nit, Self)
{
    return (Self = nit.defineWorkflowStep ("Command"))
        .require ("nit.Command")
        .defineInnerClass ("Subcommand", Subcommand =>
        {
            Subcommand
                .field ("<name>", "string", "The subcommand name.")
                .field ("options", "any", "The subcommand options.")
            ;
        })
        .field ("<name>", "string", "The command name.", { exprAllowed: true })
        .field ("options", "any", "Use command options", { exprAllowed: true })
        .field ("subcommand", Self.Subcommand.name, "The subcommand to run.", { exprAllowed: true })
        .onRun (async function ()
        {
            let self = this;
            let command = nit.lookupCommand (self.name);
            let scOpt = command.Input.subcommandOption;
            let input = command.Input.parseArgv (self.options);

            if (self.subcommand && scOpt)
            {
                let subcommandClass = scOpt.class.lookup (self.subcommand.name);

                input[scOpt.name] = new subcommandClass ({ input: self.subcommand.options });
            }

            let context = await new command.Context (command.Input.fromArgv (input));

            return await command ().run (context);
        })
    ;
};

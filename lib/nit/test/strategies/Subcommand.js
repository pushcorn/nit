module.exports = function (nit)
{
    return nit.test.defineStrategy ("Subcommand")
        .require ("nit.Command")
        .field ("<command>", "command", "The command to test.")
        .field ("<subcommand>", "string", "The subcommand to test.")
        .field ("commandArgs...", "any", "The command arguments.")

        .property ("class", "function")
        .property ("object", "nit.Command")
        .property ("context", "nit.Command.Context")
        .do (() => nit.require ("nit.Subcommand").autoRegister = false)

        .onConstruct (function (command)
        {
            let cls = nit.lookupCommand (command);

            this.class = cls;
            this.description = this.description || `${cls.name} subcommand: ${this.subcommand}`;
        })
        .onTestUp (async function ()
        {
            let cls = this.class;

            cls.Input.subcommandOption.class.registerSubcommands ();

            let input = cls.Input.fromArgv (...this.commandArgs, this.subcommand, ...arguments);

            this.context = await new cls.Context (input);
            this.object = await new cls;
        })
        .onTest (async function ()
        {
            return await this.object.run (this.context);
        })
    ;
};

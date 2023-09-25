module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Help"))
        .describe ("Display the help overview or help of a command.")
        .defineInput (Input =>
        {
            Input.option ("[command]", "command", "The command name.");
        })
        .staticMethod ("help", function ()
        {
            return nit.Command.help.call (this)
                .paragraph ("Available commands:")
                .table (nit.listCommands ()
                    .sort ((a, b) => a.compareTo (b))
                    .map (c => ({ cols: [" " + c.name, nit.trim (c.class.DESCRIPTION)] }))
                )
            ;
        })
        .onRun (async function (ctx)
        {
            let { command } = ctx.input;
            let cls = command ? await nit.lookupCommand (command) : Self;

            return cls.help ().build ();
        })
    ;
};

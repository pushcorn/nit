module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Help"))
        .describe ("Display the help overview or help of a command.")
        .defineInput (Input =>
        {
            Input.option ("[command]", "nit.Command.Type", "The command name.");
        })
        .staticMethod ("help", function ()
        {
            return nit.Command.help.call (this)
                .paragraph ("Available commands:")
                .table (nit.listCommands ()
                    .sort ((a, b) => a.compareTo (b))
                    .map (c =>
                    {
                        let cls = nit.require (c.path);
                        let cols =
                        [
                            " " + c.name,
                            cls.DESCRIPTION || ""
                        ];

                        return { cols };
                    })
                )
            ;
        })
        .run (async function (ctx)
        {
            let { command } = ctx.input;
            let cls = command ? await command.lookup () : Self;

            return cls.help ().build ();
        })
    ;
};

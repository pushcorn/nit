module.exports = function (nit)
{
    return nit.defineCommand ("Git")
        .defineInput (function (Input)
        {
            Input
                .option ("<gitcommand>", "nit.GitSubcommand", "The git subcommand.")
                .option ("auth", "string")
                .option ("silent", "boolean")
            ;
        })
        .onRun (function ({ input: { gitcommand } })
        {
            return gitcommand.new ().run ();
        })
    ;
};

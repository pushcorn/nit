module.exports = function (nit)
{
    return nit.defineCommand ("Git")
        .describe ("Execute a git command.")
        .defineInput (function (Input)
        {
            Input
                .option ("<gitcommand>", "nit.GitSubcommand", "The git subcommand.")
                .option ("auth", "string", "The auth token.")
                .option ("silent", "boolean", "Do not output the status code stderr.")
            ;
        })
        .onRun (function ({ input: { gitcommand } })
        {
            return gitcommand.new ().run ();
        })
    ;
};

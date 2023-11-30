module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("Git"))
        .describe ("Execute a git command.")
        .defineSubcommand (Subcommand =>
        {
            Subcommand
                .onBuildSubcommand ((Subcommand, Git) =>
                {
                    Subcommand
                        .describe (Git.description)
                        .defineInput (Input =>
                        {
                            Input.importProperties (Git.fields);
                        })
                    ;
                })
            ;
        })
        .defineInput (function (Input)
        {
            Input
                .option ("<gitcommand>", Self.Subcommand.name, "The git subcommand.")
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

module.exports = function (nit)
{
    return nit.defineClass ("nit.GitSubcommand", "nit.Subcommand")
        .meta ("category", "gits")
        .onBuildSubcommand ((Subcommand, Git) =>
        {
            Subcommand
                .describe (Git.description)
                .defineInput (Input =>
                {
                    Input.import (Git.fields);
                })
            ;
        })
    ;
};

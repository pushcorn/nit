module.exports = function (nit)
{
    return nit.defineCommand ("commands.PositionalArgs")
        .describe ("A command with two positional options.")
        .defineInput (function (Input)
        {
            Input
                .option ("<source>", "file", "The source file.")
                .option ("<target...>", "file", "The target file.")
            ;
        })
    ;
};

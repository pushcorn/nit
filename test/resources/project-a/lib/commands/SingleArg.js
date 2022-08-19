module.exports = function (nit)
{
    return nit.defineCommand ("commands.SingleArg")
        .describe ("A command with one option.")
        .defineInput (function (Input)
        {
            Input
                .option ("arg", "string", "test arg")
            ;
        })
    ;
};

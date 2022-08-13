module.exports = function (nit)
{
    return nit.defineCommand ("DumpFile")
        .defineInput (function (Input)
        {
            Input
                .option ("unused", "nit.Dir")
                .option ("[file]", "nit.File")
            ;
        })
    ;
};

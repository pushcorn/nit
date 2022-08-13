module.exports = function (nit)
{
    return nit.defineCommand ("ListFiles")
        .defineInput (function (Input)
        {
            Input
                .option ("unused", "nit.File")
                .option ("[dir]", "nit.Dir")
            ;
        })
    ;
};

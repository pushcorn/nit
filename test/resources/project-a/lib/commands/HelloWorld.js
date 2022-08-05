module.exports = function (nit)
{
    return nit.defineCommand ("commands.HelloWorld")
        .defineInput (function (Input)
        {
            Input
                .option ("message")
            ;
        })
    ;
};

module.exports = function (nit)
{
    return nit.defineCommand ("commands.HelloWorld")
        .defineInput (function (Input)
        {
            Input
                .option ("[message]", "string", "The greeting message.")
                .option ("color", "string", "The message color.", { autoShortFlag: false })
            ;
        })
    ;
};

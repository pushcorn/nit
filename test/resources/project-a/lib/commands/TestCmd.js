module.exports = function (nit)
{
    return nit.defineCommand ("commands.TestCmd")
        .defineInput (function (Input)
        {
            Input
                .option ("[file]", "file")
                .option ("choice", "string")
                    .constraint ("choice", "first choice", "second_choice", "3rd choice", "first <! second", "with a \" quote", "size:large", "colon:sep:value")
                .option ("service", "string")
                    .constraint ("choice", "srv1", "srv2")
                .option ("base64", "boolean")
            ;
        })
        .method ("run", function ()
        {
            console.log ("This is the test command.");
        })
    ;
};

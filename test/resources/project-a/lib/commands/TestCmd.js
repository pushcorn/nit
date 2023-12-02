module.exports = function (nit)
{
    return nit.defineCommand ("commands.TestCmd")
        .describe ("A test command.")
        .defineInput (function (Input)
        {
            Input
                .option ("[file]", "file", "file option")
                .option ("choice", "string", "choice option")
                    .constraint ("choice", "first choice", "second_choice", "3rd choice", "first <! second", "with a \" quote", "size:large", "colon:sep:value")
                .option ("service", "string", "service option")
                    .constraint ("choice", "srv1", "srv2")
                .option ("base64", "boolean", "base64 option")
                .option ("docIds...", "integer", "docIds option")
            ;
        })
        .onRun (function ()
        {
            return "This is the test command.";
        })
    ;
};

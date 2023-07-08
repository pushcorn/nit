module.exports = function (nit)
{
    return nit.defineCommand ("TestCmd")
        .defineInput (function (Input)
        {
            Input
                .option ("[dir]", "dir")
            ;
        })
        .onRun (function ()
        {
            return "Test command for project-c.";
        })
    ;
};

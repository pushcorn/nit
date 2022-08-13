module.exports = function (nit)
{
    return nit.defineCommand ("TestCmd")
        .defineInput (function (Input)
        {
            Input
                .option ("[dir]", "dir")
            ;
        })
        .method ("run", function ()
        {
            return "Test command for project-c.";
        })
    ;
};

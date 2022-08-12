module.exports = function (nit)
{
    return nit.defineCommand ("TestCmd")
        .method ("run", function ()
        {
            return "Test command for project-c.";
        })
    ;
};

module.exports = function (nit)
{
    return nit.defineClass ("commandadapters.Api", "nit.CommandAdapter")
        .onBuildCommand (Command =>
        {
            Command
                .defineMeta ("built", "boolean", true)
            ;
        })
    ;
};

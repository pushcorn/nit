module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("gits.Push", "Git"))
        .describe ("Update remote refs along with associated objects")
        .defineInnerClass ("LogLevel", LogLevel =>
        {
            LogLevel
                .field ("<name>", "string")
                    .constraint ("choice", "info", "error", "warn", "debug")
            ;
        })
        .field ("[repo]", "string")
        .field ("[logLevel]", Self.LogLevel.name)
        .field ("all", "boolean")
    ;
};

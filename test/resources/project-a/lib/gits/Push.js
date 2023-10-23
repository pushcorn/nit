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
        .field ("[repo]", "string", "The target repository.")
        .field ("[logLevel]", Self.LogLevel.name, "The log level.")
        .field ("all", "boolean", "Push all commits.")
    ;
};

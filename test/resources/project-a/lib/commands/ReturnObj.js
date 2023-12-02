module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.ReturnObj"))
        .describe ("A command that returns an object.")
        .defineInnerClass ("Result", Result =>
        {
            Result.field ("<value>", "integer");
        })
        .onRun (function ()
        {
            return new Self.Result (100);
        })
    ;
};

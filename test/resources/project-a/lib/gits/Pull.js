module.exports = function (nit)
{
    return nit.defineClass ("gits.Pull", "Git")
        .describe ("Fetch from and integrate with another repository or a local branch")
        .field ("all", "boolean")
        .field ("verbose", "boolean")
        .field ("repository", "string")
        .onRun (function ()
        {
            return ["pull completed", this.repository].filter (nit.is.not.empty).join (" from ");
        })
    ;
};

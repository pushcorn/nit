module.exports = function (nit)
{
    return nit.defineClass ("gits.Pull", "Git")
        .describe ("Update remote refs along with associated objects")
        .field ("[repo]", "string")
        .field ("all", "boolean")
    ;
};

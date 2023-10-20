module.exports = function (nit)
{
    return nit.defineClass ("gits.Push", "Git")
        .describe ("Update remote refs along with associated objects")
        .field ("[repo]", "string")
        .field ("all", "boolean")
    ;
};

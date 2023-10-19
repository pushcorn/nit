module.exports = function (nit)
{
    return nit.defineClass ("Git")
        .categorize ("gits")
        .defineMeta ("description", "string")
        .staticMethod ("describe", function (description)
        {
            return this.meta ("description", description);
        })
    ;
};

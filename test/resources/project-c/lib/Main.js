module.exports = function (nit)
{
    return nit.defineClass ("Main", "Sup")
        .field ("b", "string")
        .field ("c", "boolean")
    ;
};

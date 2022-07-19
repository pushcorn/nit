module.exports = function (nit)
{
    return nit.defineClass ("B")
        .require ("A");
};

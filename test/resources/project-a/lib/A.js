module.exports = function (nit)
{
    return nit.defineClass ("A")
        .require ("B");
};

module.exports = function (nit)
{
    return nit.defineClass ("Work")
        .staticProperty ("loadedAt", "Date", new Date ())
    ;
};

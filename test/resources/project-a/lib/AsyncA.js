module.exports = function (nit)
{
    return nit.defineClass ("AsyncA")
        .field ("ab", "AsyncB",
        {
            defval: "@AsyncB"
        })
    ;
};

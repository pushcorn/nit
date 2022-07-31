module.exports = function (nit)
{
    nit.Object
        .registerTypeParser (new nit.Object.PrimitiveTypeParser ("file", "", function (v) { return nit.is.undef (v) ? "" : v; }))
    ;
};




module.exports = function (nit)
{
    nit.Object
        .registerTypeParser (new nit.Object.PrimitiveTypeParser ("file", "", function (v) { return typeof v == "object" || typeof v == "function" ? undefined : (v + ""); }))
    ;
};




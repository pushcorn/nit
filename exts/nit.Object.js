module.exports = function (nit)
{
    const { PrimitiveTypeParser } = nit.Object;

    nit.Object
        .registerTypeParser (new PrimitiveTypeParser ("file", "", function (v) { return PrimitiveTypeParser.valueToString (v); }))
        .registerTypeParser (new PrimitiveTypeParser ("dir", "", function (v) { return PrimitiveTypeParser.valueToString (v); }))
    ;
};




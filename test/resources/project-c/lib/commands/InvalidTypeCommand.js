module.exports = function (nit)
{
    return nit.defineCommand ("InvalidTypeCommand")
        .plugin ("test.InvalidPlugin")
    ;
};

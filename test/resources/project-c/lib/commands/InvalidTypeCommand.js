module.exports = function (nit)
{
    return nit.defineCommand ("InvalidTypeCommand")
        .commandplugin ("test.InvalidPlugin")
    ;
};

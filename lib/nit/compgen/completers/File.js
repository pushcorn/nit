module.exports = function (nit)
{
    return nit.compgen.defineCompleter ("File")
        .method ("completeForRedirect", function (ctx) // eslint-disable-line no-unused-vars
        {
            return [nit.Compgen.ACTIONS.FILE];
        })
        .method ("completeForType", function (ctx)
        {
            if (ctx.currentOption?.type == "file")
            {
                return [nit.Compgen.ACTIONS.FILE];
            }
        })
    ;
};

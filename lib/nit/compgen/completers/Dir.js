module.exports = function (nit)
{
    return nit.compgen.defineCompleter ("Dir")
        .method ("completeForType", function (ctx)
        {
            if (ctx.currentOption?.type == "dir")
            {
                return [nit.Compgen.ACTIONS.DIR];
            }
        })
    ;
};

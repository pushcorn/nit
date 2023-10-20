module.exports = function (nit, Self)
{
    return (Self = nit.lookupClass ("constraints.Timezone"))
        .defineInnerClass ("completers.Timezone", "nit.compgen.Completer", Completer =>
        {
            Completer
                .onCompleteForConstraint (function (ctx)
                {
                    let constraint = ctx.currentOption?.getConstraint ("timezone");

                    if (constraint)
                    {
                        return [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (Self.TIMEZONES)];
                    }
                })
            ;
        })
    ;
};

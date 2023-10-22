module.exports = function (nit)
{
    return nit.defineCompgenCompleter ("TimezoneConstraint")
        .completeForConstraint ("constraints.Timezone", function (ctx)
        {
            return [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (ctx.currentConstraint.constructor.TIMEZONES)];
        })
    ;
};

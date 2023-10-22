module.exports = function (nit)
{
    return nit.defineCompgenCompleter ("ChoiceConstraint")
        .completeForConstraint ("constraints.Choice", function (ctx)
        {
            let quote = ctx.quote || '"';
            let quoteRe = new RegExp ("(" + quote + ")", "g");
            let completions = ctx.filterCompletions (ctx.currentConstraint.choiceValues)
                .map (c =>
                {
                    if (c.match (nit.Compgen.ESCAPED_CHARS))
                    {
                        c = quote + c.replace (quoteRe, "\\$1") + quote;
                    }

                    return c;
                })
            ;

            return [nit.Compgen.ACTIONS.VALUE, ...completions];
        })
    ;
};

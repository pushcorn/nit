module.exports = function (nit)
{
    return nit.compgen.defineCompleter ("Choice")
        .method ("completeForConstraint", function (ctx)
        {
            let constraint = ctx.currentOption?.getConstraint ("choice");

            if (!constraint)
            {
                return;
            }

            let completions = [nit.Compgen.ACTIONS.VALUE];
            let quote = ctx.quote || '"';
            let quoteRe = new RegExp ("(" + quote + ")", "g");

            constraint.choices
                .filter (c => c.startsWith (ctx.currentValue))
                .forEach (c =>
                {
                    if (c.match (nit.Compgen.ESCAPED_CHARS))
                    {
                        c = quote + c.replace (quoteRe, "\\$1") + quote;
                    }

                    completions.push (c);
                })
            ;

            return completions;
        })
    ;
};

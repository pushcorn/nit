module.exports = function (nit, Self)
{
    return (Self = nit.compgen.defineCompleter ("Choice"))
        .staticMethod ("getChoiceConstraint", function (option)
        {
            let constraint = option?.getConstraint ("choice");

            if (!option || option.primitive || constraint)
            {
                return constraint;
            }

            return Self.getChoiceConstraint (option.class.properties[0]);
        })
        .method ("completeForConstraint", function (ctx)
        {
            let constraint = Self.getChoiceConstraint (ctx.currentOption);

            if (!constraint)
            {
                return;
            }

            let quote = ctx.quote || '"';
            let quoteRe = new RegExp ("(" + quote + ")", "g");
            let completions = ctx.filterCompletions (constraint.choiceValues)
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

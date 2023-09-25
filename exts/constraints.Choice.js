module.exports = function (nit)
{
    return nit.lookupClass ("constraints.Choice")
        .defineInnerClass ("completers.Choice", "nit.compgen.Completer", Completer =>
        {
            Completer
                .staticMethod ("getChoiceConstraint", function (option)
                {
                    let constraint = option?.getConstraint ("choice");

                    if (!option || option.primitive || constraint)
                    {
                        return constraint;
                    }

                    return Completer.getChoiceConstraint (option.class.properties[0]);
                })
                .onCompleteForConstraint (function (ctx)
                {
                    let constraint = Completer.getChoiceConstraint (ctx.currentOption);

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
        })
    ;
};

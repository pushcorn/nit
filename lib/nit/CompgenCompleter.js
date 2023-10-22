module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.CompgenCompleter"))
        .use ("nit.Compgen")
        .constant ("DEFAULT_PRIORITY", 10)
        .categorize ("nit.compgencompleters")
        .defineMeta ("priority", "integer", Self.DEFAULT_PRIORITY)
        .staticMethod ("prioritize", function (priority)
        {
            return this.meta ("priority", priority);
        })
        .defineInnerClass ("Completer", Completer =>
        {
            Completer
                .defineMeta ("completionType", "string")
                .staticMethod ("forCompletionType", function (type)
                {
                    return this.meta ("completionType", type);
                })
                .field ("<generator>", "function", "The completions generator function.")
                .lifecycleMethod ("applicableTo", true) // function (ctx) { return <boolean>; })
                .method ("generate", function (ctx)
                {
                    if (this.applicableTo (ctx))
                    {
                        return this.generator (ctx);
                    }
                })
            ;
        })
        .staticMethod ("defineCompleter", function (name, builder)
        {
            return this.defineInnerClass (name, Self.Completer.name, builder);
        })
        .defineCompleter ("OptionCompleter", OptionCompleter =>
        {
            OptionCompleter
                .forCompletionType (Self.Compgen.COMPLETION_TYPES.option)
                .field ("<path>", "string", "The option's dot path (class-name.option-name).")
                .onApplicableTo (function (ctx)
                {
                    let [className, optName] = nit.kvSplit (this.path, ".", true);

                    return ctx.commandClass?.name == className && ctx.currentOption?.name == optName;
                })
            ;
        })
        .defineCompleter ("RedirectCompleter", RedirectCompleter =>
        {
            RedirectCompleter
                .forCompletionType (Self.Compgen.COMPLETION_TYPES.redirect)
                .onApplicableTo (() => true)
            ;
        })
        .defineCompleter ("TypeCompleter", TypeCompleter =>
        {
            TypeCompleter
                .forCompletionType (Self.Compgen.COMPLETION_TYPES.type)
                .field ("<types...>", "string", "The field type.")
                .onApplicableTo (function (ctx)
                {
                    return this.types.includes (ctx.currentOption?.type);
                })
            ;
        })
        .defineCompleter ("ConstraintCompleter", ConstraintCompleter =>
        {
            ConstraintCompleter
                .forCompletionType (Self.Compgen.COMPLETION_TYPES.constraint)
                .field ("<type>", "string", "The constraint type.")
                    .constraint ("subclass", "nit.Constraint")
                .onApplicableTo (function (ctx)
                {
                    return !!(ctx.currentConstraint = ctx.findConstraint (this.type));
                })
            ;
        })
        .staticProperty ("completers...", Self.Completer.name)

        .staticMethod ("completeForRedirect", function (generator)
        {
            this.completers.push (new Self.RedirectCompleter (generator));

            return this;
        })
        .staticMethod ("completeForOption", function (path, generator)
        {
            this.completers.push (new Self.OptionCompleter (generator, path));

            return this;
        })
        .staticMethod ("completeForType", function (types, generator)
        {
            this.completers.push (new Self.TypeCompleter (generator, { types }));

            return this;
        })
        .staticMethod ("completeForConstraint", function (type, generator)
        {
            this.completers.push (new Self.ConstraintCompleter (generator, type));

            return this;
        })
        .staticMethod ("generate", function (ctx)
        {
            for (let g of this.completers.filter (c => c.constructor.completionType === ctx.completionType))
            {
                let completions;

                if ((completions = g.generate (ctx)))
                {
                    return completions;
                }
            }
        })
    ;
};

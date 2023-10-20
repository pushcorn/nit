module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Subcommand"))
        .defineMeta ("category", "string")
        .defineMeta ("description", "string")
        .use ("nit.Command")
        .defineCaster ("component")
        .staticMemo ("subcommandCategory", function ()
        {
            return nit.categoryName (this);
        })
        .staticMethod ("registerSubcommands", function ()
        {
            let cls = this;

            for (let descriptor of cls.listBackingComponents ())
            {
                let name = descriptor.name;
                let className = nit.ComponentDescriptor.toClassName (name, cls.subcommandCategory);

                nit.registerClass.lazy (className, function ()
                {
                    return cls.buildSubcommand (className, descriptor);
                });
            }

            return cls;
        })
        .staticMethod ("listBackingComponents", function ()
        {
            return nit.listComponents (this.category);
        })
        .staticMemoMethod ("registerAndCacheSubcommands", function ()
        {
            return this.registerSubcommands ();
        })
        .staticMemoMethod ("listAndCachBackingComponents", function ()
        {
            return this.listBackingComponents ();
        })
        .staticMethod ("forComponent", function (component)
        {
            return this.meta ("category", nit.categoryName (component));
        })
        .staticMethod ("describe", function (description)
        {
            return this.meta ("description", description);
        })
        .staticMethod ("listSubcommands", function (returnNames)
        {
            return nit.listComponents (this.subcommandCategory, returnNames);
        })
        .staticMethod ("lookup", function (name)
        {
            return nit.lookupComponent (name, this.subcommandCategory, Self);
        })
        .staticLifecycleMethod ("buildSubcommand", true, function (className, descriptor)
        {
            let cls = this;
            let cmdCls = nit.defineClass (className, cls.name);

            cls[cls.kBuildSubcommand] (cmdCls, descriptor.class);

            return cmdCls;
        })
        .staticMethod ("defineInput", function (builder)
        {
            return this.defineInnerClass ("Input", Self.Command.Input.name, builder);
        })
        .defineInnerClass ("Completer", "nit.compgen.Completer", function (Completer)
        {
            Completer
                .onCompleteForType (function (ctx)
                {
                    let outerClass = this.outerClass;
                    let type = ctx.currentOption?.type;

                    if (type == outerClass.name)
                    {
                        let apis = outerClass.listAndCachBackingComponents ().map (d => d.name);

                        return [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (apis)];
                    }
                })
            ;
        })
        .onDefineSubclass (Subclass =>
        {
            if (Subclass.superclass == Self)
            {
                Subclass
                    .onPostNsInvoke (function ()
                    {
                        Subclass.registerAndCacheSubcommands ();
                    })
                    .defineInnerClass ("completers.Subcommand", Self.Completer.name)
                ;
            }
            else
            {
                Subclass
                    .defineInput ()
                    .field ("input", Subclass.Input.name, "The subcommand options.")
                ;
            }
        })
        .memo ("component", true, false, function ()
        {
            let self = this;
            let cls = self.constructor;
            let name = nit.ComponentDescriptor.normalizeName (cls.name).replace (cls.superclass.subcommandCategory + ":", "");

            return nit.lookupComponent (name, self.constructor.category);
        })
        .method ("new", function ()
        {
            return nit.new (this.component, arguments.length ? arguments : this.input.toPojo ());
        })
    ;
};

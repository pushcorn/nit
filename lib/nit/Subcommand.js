module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Subcommand"))
        .defineMeta ("category", "string")
        .defineMeta ("description", "string")
        .use ("nit.Command")
        .use ("nit.utils.HelpBuilder")
        .plugin ("compgen-completer")
        .defineCaster ("component")
        .staticMemo ("subcommandCategory", function ()
        {
            return nit.categoryName (this);
        })
        .staticMemoMethod ("registerSubcommands", function ()
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
        .staticMemoMethod ("listBackingComponents", function ()
        {
            return nit.listComponents (this.category);
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
            this.registerSubcommands ();

            return nit.listComponents (this.subcommandCategory, returnNames);
        })
        .staticMethod ("lookup", function (name)
        {
            this.registerSubcommands ();

            return nit.lookupComponent (name, this.subcommandCategory, Self);
        })
        .staticLifecycleMethod ("buildSubcommand", true, function (className, descriptor)
        {
            let cls = this;
            let cmdCls = nit.defineClass (className, cls.name);

            cls[cls.kBuildSubcommand] (cmdCls, descriptor.class, descriptor);

            return cmdCls;
        })
        .staticMethod ("defineInput", function (builder)
        {
            return this.defineInnerClass ("Input", Self.Command.Input.name, builder);
        })
        .staticMethod ("help", function (cmd)
        {
            let subcommand = this;
            let help = new Self.HelpBuilder;
            let Input = subcommand.Input;
            let defvals = Input.defaults ();
            let pargs = Input.pargs.slice ();
            let opts = Input.nargs.slice ();

            opts.sort ((a, b) => a.flag.localeCompare (b.flag));

            help
                .paragraph (subcommand.description)
                .paragraph ("Usage: nit "
                    + nit.getComponentDescriptor (cmd).name + " "
                    + (cmd.Input.nargs.length ? "[command-options...] " : "")
                    + nit.getComponentDescriptor (subcommand).name
                    + (pargs.length ? " " + pargs.map (p => p.helpSpec).join (" ") : "")
                )
            ;

            if (opts.length + pargs.length)
            {
                help.paragraph ("Options:");

                Self.Command.buildPargsTable (help, pargs, defvals);
                Self.Command.buildNargsTable (help, opts, defvals);
            }

            return help;
        })
        .onDefineSubclass (Subclass =>
        {
            if (Subclass.superclass == Self)
            {
                Subclass
                    .forComponent (Subclass.simpleName.replace (/Subcommand$/, ""))
                    .defineCompgenCompleter (Completer =>
                    {
                        Completer
                            .completeForType (Subclass.name, ctx =>
                            {
                                let comps = Subclass.listBackingComponents ().map (d => d.name);

                                return [nit.Compgen.ACTIONS.SUBCOMMAND, ...ctx.filterCompletions (comps)];
                            })
                        ;
                    })
                ;
            }
            else
            {
                Subclass
                    .defineInput ()
                    .field ("input", Subclass.Input.name, "The subcommand options.", () => ({}))
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

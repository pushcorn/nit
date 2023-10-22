module.exports = function (nit, Self)
{
    let writer = new nit.Object.Property.Writer;


    return (Self = nit.defineClass ("nit.Command"))
        .defineMeta ("description", "string", "Description not available.")
        .categorize ("commands")
        .use ("nit.Subcommand")
        .plugin ("compgen-completer")
        .registerStringTypeParser ("command")
        .defineCompgenCompleter (Completer =>
        {
            Completer
                .completeForType ("command", ctx => [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (nit.listCommands (true))])
            ;
        })
        .defineInnerPlugin ("CommandPlugin", CommandPlugin =>
        {
            CommandPlugin
                .categorize ("nit.commandplugins")
                .lifecycleMethod ("preRun", null, /* istanbul ignore next */ function (ctx, cmd) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("postRun", null, /* istanbul ignore next */ function (ct, cmd) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("preCatch", null, /* istanbul ignore next */ function (ctx, cmd) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("postCatch", null, /* istanbul ignore next */ function (ctx, cmd) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("preFinally", null, /* istanbul ignore next */ function (ctx, cmd) {}) // eslint-disable-line no-unused-vars
                .lifecycleMethod ("postFinally", null, /* istanbul ignore next */ function (ctx, cmd) {}) // eslint-disable-line no-unused-vars
            ;
        })
        .staticMethod ("describe", function (description)
        {
            return this.meta ("description", description);
        })
        .staticMethod ("help", function ()
        {
            let cmd = this;
            let help = nit.new ("nit.utils.HelpBuilder");
            let opts = [];
            let pargs = [];
            let defvals = cmd.defaults ();

            cmd.Input.fields
                .forEach (p =>
                {
                    if (p.positional)
                    {
                        pargs.push (p);
                    }
                    else
                    {
                        opts.push (p);
                    }
                })
            ;

            opts.sort ((a, b) => a.flag.localeCompare (b.flag));

            help
                .paragraph (cmd.description)
                .paragraph ("Usage: nit "
                    + nit.getComponentDescriptor (cmd).name
                    + (pargs.length ? " " + pargs.map (p => p.helpSpec).join (" ") : "")
                )
            ;

            if (opts.length + pargs.length)
            {
                help.paragraph ("Options:");
            }

            if (pargs.length)
            {
                help.table (pargs.map (p =>
                {
                    let defval = p.name in defvals ? defvals[p.name] : p.defval;
                    let cols =
                    [
                        " " + p.helpSpec,
                        p.description,
                        (p.array || p.type == "boolean" || nit.is.empty (defval)) ? "" : "[default: " + defval + "]"
                    ];

                    return { cols };
                }));
            }

            if (opts.length)
            {
                help.table (opts.map (p =>
                {
                    let defval = p.name in defvals ? defvals[p.name] : p.defval;
                    let cols =
                    [
                        " " + (p.shortFlag ? "-" + p.shortFlag + ", " : "    ") + p.helpSpec,
                        p.description,
                        (p.array || p.type == "boolean" || nit.is.empty (defval)) ? "" : "[default: " + defval + "]"
                    ];

                    return { cols };
                }));
            }

            return help;
        })
        .defineInnerClass ("Option", "nit.Field", function (Option)
        {
            Option
                .defaults ("kind", "option")
                .property ("shortFlag") // The single character flag.
                .property ("autoShortFlag", "boolean", true) // Auto-assign the short flag if possible

                .getter ("flag", function () // The name in kabab case.
                {
                    return nit.kababCase (this.name);
                })
                .getter ("helpSpec", function ()
                {
                    let flag = this.flag + (this.array ? "..." : "");

                    if (this.positional)
                    {
                        if (this.required)
                        {
                            return "<" + flag + ">";
                        }
                        else
                        {
                            return "[" + flag + "]";
                        }
                    }
                    else
                    {
                        return "--" + flag;
                    }
                })
            ;
        })
        .defineInnerClass ("Input", Input =>
        {
            Input
                .m ("error.grouped_non_boolean_flags", "Multiple non-boolean flags cannot be grouped together. (Given: %{flags})")
                .m ("error.short_flag_used", "The short flag '%{shortFlag}' has been used by the option '%{option}'.")
                .m ("error.unknown_option", "The option '%{flag}' is unknown.")
                .m ("error.only_one_subcommand_allowed", "Only one subcommand option is allowed. (Defined: %{defined})")
                .m ("error.no_positional_option_with_subcommand", "The positional option '%{option}' is not allowed because the subcommand option '%{subcommandOption}' is defined.")
                .m ("error.invalid_subcommand_spec", "The subcomand option '%{option}' must be required and non-array.")
                .constant ("PRIMARY_PROPERTY_TYPE", Self.Option.name)
                .constant ("TRUTHY_VALUES", ["true", "yes", "1"])
                .constant ("FALSY_VALUES", ["false", "no", "0"])
                .constant ("BOOLEAN_VALUES", Input.TRUTHY_VALUES.concat (Input.FALSY_VALUES))
                .staticProperty ("subcommandOption", Self.Option.name, { writer })

                .staticMethod ("option", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
                {
                    let cls = this;
                    let opt = nit.new (Self.Option, arguments);
                    let scOpt = cls.subcommandOption;
                    let isSubcommand = nit.is.subclassOf (opt.class, Self.Subcommand);

                    if (scOpt)
                    {
                        if (isSubcommand)
                        {
                            cls.throw ("error.only_one_subcommand_allowed",
                            {
                                defined: cls.fields.find (o => nit.is.subclassOf (o.class, Self.Subcommand)).name + ", " + opt.name
                            });
                        }
                        else
                        if (opt.positional)
                        {
                            cls.throw ("error.no_positional_option_with_subcommand", { option: opt.name, subcommandOption: scOpt.name });
                        }
                    }

                    if (isSubcommand && (!opt.required || opt.array))
                    {
                        cls.throw ("error.invalid_subcommand_spec", { option: opt.name });
                    }

                    if (!opt.positional)
                    {
                        let shortFlags = [];

                        for (let o of cls.properties)
                        {
                            if (o.shortFlag)
                            {
                                if (o.shortFlag == opt.shortFlag)
                                {
                                    cls.throw ("error.short_flag_used", { shortFlag: o.shortFlag, option: o.name });
                                }

                                shortFlags.push (o.shortFlag);
                            }
                        }

                        if (opt.autoShortFlag && !opt.shortFlag && !shortFlags.includes (opt.name[0]))
                        {
                            opt.shortFlag = opt.name[0];
                        }
                    }

                    opt.bind (cls.prototype);

                    if (isSubcommand)
                    {
                        cls.subcommandOption = writer.value (opt);
                    }

                    return cls.validatePropertyDeclarations ();
                })
                .staticMethod ("import", function (fields, omits)
                {
                    omits = nit.array (omits);

                    fields.forEach (f =>
                    {
                        this.option (f.spec, f.type, f.description, nit.omit (f.toPojo (true), "get", "set", ...omits));
                    });

                    return this;
                })
                .staticMethod ("getPositionalOptions", function ()
                {
                    return this.properties.filter (p => p.positional);
                })
                .staticMethod ("getOptionByFlag", function (flag)
                {
                    for (let opt of this.properties)
                    {
                        if (opt.flag == flag)
                        {
                            return opt;
                        }
                    }
                })
                .staticMethod ("getOptionByShortFlag", function (shortFlag)
                {
                    for (let opt of this.properties)
                    {
                        if (opt.shortFlag == shortFlag)
                        {
                            return opt;
                        }
                    }
                })
                .staticMethod ("isBooleanOption", function (opt)
                {
                    return opt.type == "boolean" || opt.mixedType && opt.type.split ("|").includes ("boolean");
                })
                .staticMethod ("fromArgv", function (argv) // eslint-disable-line no-unused-vars
                {
                    let cls = this;

                    return new cls (cls.parseArgv (...arguments));
                })
                .staticMethod ("parseArgv", function (argv)
                {
                    let unchecked = nit.is.arr (argv) ? argv : nit.array (arguments);

                    argv = [];

                    unchecked.forEach (function (arg)
                    {
                        if (nit.is.obj (arg))
                        {
                            nit.each (arg, function (v, k)
                            {
                                argv.push ("--" + k, v);
                            });
                        }
                        else
                        {
                            argv.push (arg);
                        }
                    });

                    let cls = this;
                    let options = {};
                    let positionals = [];
                    let optsByShortFlag = {};
                    let optsByFlag = {};
                    let pargs = [];
                    let subcommandOption = cls.subcommandOption;
                    let arg;

                    cls.properties
                        .forEach ((opt) =>
                        {
                            if (opt.shortFlag)
                            {
                                optsByShortFlag[opt.shortFlag] = opt;
                            }

                            if (opt.positional)
                            {
                                pargs.push (opt);
                            }

                            optsByFlag[opt.flag] = opt;
                        })
                    ;


                    function setOption (opt, value)
                    {
                        value = nit.toVal (value);

                        options[opt.name] = !opt.array ? value : nit.array (options[opt.name]).concat (nit.array (value));
                    }


                    function getValue (opt)
                    {
                        let values = [];
                        let next = argv[0];
                        let isBool = cls.isBooleanOption (opt);

                        while (next !== undefined && next[0] != "-")
                        {
                            if (isBool)
                            {
                                let lcNext = (next + "").toLowerCase ();

                                if (!cls.BOOLEAN_VALUES.includes (lcNext))
                                {
                                    break;
                                }
                                else
                                {
                                    argv[0] = cls.TRUTHY_VALUES.includes (lcNext);
                                }
                            }

                            values.push (argv.shift ());
                            next = argv[0];

                            if (!opt.array)
                            {
                                break;
                            }
                        }

                        return values.length > 1 ? values : values[0];
                    }

                    while ((arg = argv.shift ()))
                    {
                        if (arg == "--")
                        {
                            positionals = positionals.concat (argv.splice (0));
                            break;
                        }
                        else
                        if (arg[0] == "-")
                        {
                            let kv = nit.kvSplit (arg, "=");
                            let [k, v] = kv;

                            if (k[1] == "-")
                            {
                                k = k.slice (2);
                                k = nit.kababCase (k);

                                let opt = optsByFlag[k];

                                if (opt)
                                {
                                    v = v === undefined ? getValue (opt) : v;

                                    setOption (opt, cls.isBooleanOption (opt) && v === undefined ? true : v);
                                }
                                else
                                {
                                    cls.throw ("error.unknown_option", { flag: "--" + k });
                                }
                            }
                            else // short flags, possibly grouped
                            {
                                let nonBooleanFlags = [];

                                k = k.slice (1).split ("").map (function (n)
                                {
                                    let opt = optsByShortFlag[n];

                                    if (opt)
                                    {
                                        v = v === undefined ? getValue (opt) : v;

                                        if (cls.isBooleanOption (opt))
                                        {
                                            setOption (opt, v === undefined ? true : v);
                                        }
                                        else
                                        {
                                            nonBooleanFlags.push (n);
                                            setOption (opt, v);
                                        }
                                    }
                                    else
                                    {
                                        cls.throw ("error.unknown_option", { flag: "-" + n });
                                    }

                                    return n;
                                });

                                if (k.length > 1 && nonBooleanFlags.length > 1)
                                {
                                    cls.throw ("error.grouped_non_boolean_flags", { flags: arg });
                                }
                            }
                        }
                        else
                        if (subcommandOption)
                        {
                            let subcommandClass = subcommandOption.class.lookup (arg);

                            options[subcommandOption.name] = new subcommandClass ({ input: subcommandClass.Input.parseArgv (argv.splice (0)) });
                        }
                        else
                        {
                            positionals.push (arg);
                        }
                    }

                    var parg;
                    var arrParg;

                    while (pargs.length)
                    {
                        parg = pargs.shift ();

                        if (options[parg.name])
                        {
                            continue;
                        }

                        if (!parg.array)
                        {
                            options[parg.name] = positionals.shift ();
                        }
                        else
                        {
                            arrParg = parg;
                            break;
                        }
                    }

                    while (pargs.length)
                    {
                        parg = pargs.pop ();

                        if (positionals.length)
                        {
                            options[parg.name] = positionals.pop ();
                        }
                    }

                    if (arrParg)
                    {
                        if (positionals.length)
                        {
                            options[arrParg.name] = positionals.splice (0);
                        }
                    }

                    return options;
                })
            ;
        })

        .defineInnerClass ("Context", function (Context)
        {
            Context
                .field ("[input]", Self.Input.name, "The command input.")
                .field ("error", "Error", "The error thrown by the run method.")
                .field ("output", "any", "The command output.")
                .staticGetter ("inputClass", function ()
                {
                    let ctxName = this.name;
                    let cmdCls = nit.lookupClass (nit.kvSplit (ctxName, ".", true).shift ());

                    return cmdCls && cmdCls.Input;
                })
                .staticMethod ("forInput", function (...options)
                {
                    let cls = this;
                    let inputClass = cls.inputClass;

                    return new cls (inputClass && inputClass (...options));
                })
                .onConstruct (function ()
                {
                    if (!this.input)
                    {
                        let inputClass = this.constructor.inputClass;

                        if (inputClass)
                        {
                            this.input = new inputClass;
                        }
                    }
                })
            ;
        })
        .staticMethod ("defineInput", function (builder)
        {
            return this.defineInnerClass ("Input", this.superclass.Input.name, builder);
        })
        .staticMethod ("defineContext", function (builder)
        {
            return this.defineInnerClass ("Context", this.superclass.Context.name, builder);
        })
        .onDefineSubclass (Subclass =>
        {
            Subclass.defineInput ();
            Subclass.defineContext ();
        })
        .lifecycleMethod ("run", async function (...options)
        {
            let cmd = this;
            let cls = cmd.constructor;
            let ctx = options[0] instanceof cls.Context ? options[0] : await new cls.Context (cls.Input.fromArgv (...options));

            try
            {
                try
                {
                    await cls.applyPlugins ("commandplugins", "preRun", ctx, cmd);

                    return ctx.output = await cls[Self.kRun]?.call (cmd, ctx);
                }
                finally
                {
                    await cls.applyPlugins ("commandplugins", "postRun", ctx, cmd);
                }
            }
            catch (e)
            {
                Object.setPrototypeOf (e, Error.prototype); // In test mode, native errors are not instances of Error.

                ctx.error = e;

                try
                {
                    await cls.applyPlugins ("commandplugins", "preCatch", ctx, cmd);
                    await cmd.catch (ctx);
                }
                finally
                {
                    await cls.applyPlugins ("commandplugins", "postCatch", ctx, cmd);
                }
            }
            finally
            {
                try
                {
                    await cls.applyPlugins ("commandplugins", "preFinally", ctx, cmd);
                    await cmd.finally (ctx);
                }
                finally
                {
                    await cls.applyPlugins ("commandplugins", "postFinally", ctx, cmd);
                }
            }
        })
        .lifecycleMethod ("catch", function (ctx)
        {
            let c = this.constructor[Self.kCatch];

            if (c)
            {
                return c.call (this, ctx);
            }
            else
            {
                throw ctx.error;
            }
        })
        .lifecycleMethod ("finally", function (ctx)
        {
            return this.constructor[Self.kFinally]?.call (this, ctx);
        })
        .method ("confirm", async function (message, ...args)
        {
            return await nit.require ("nit.utils.Stdio").confirm (this.t (message, ...args));
        })
    ;
};

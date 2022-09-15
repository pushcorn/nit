module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Command"))
        .constant ("DESCRIPTION", "Description not available.")
        .categorize ()
        .staticMethod ("describe", function (description)
        {
            return this.constant ("DESCRIPTION", description);
        })
        .staticMethod ("help", function ()
        {
            let cmd = this;
            let help = nit.new ("nit.utils.HelpBuilder");
            let opts = [];
            let pargs = [];
            let defvals = cmd.defaults ();

            cmd.Input.getProperties ()
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
                .paragraph (cmd.DESCRIPTION)
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
        .defineInnerClass ("Type", Type =>
        {
            Type
                .defineInnerClass ("Completer", "nit.compgen.Completer", Completer =>
                {
                    Completer
                        .method ("completeForType", function (ctx)
                        {
                            if (ctx.currentOption?.type == Type.name)
                            {
                                return [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (nit.listCommands (true))];
                            }
                        })
                    ;
                })
                .field ("<name>", "string", "The command name.")
                .method ("lookup", function ()
                {
                    return nit.lookupCommand (this.name);
                })
            ;
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
                .constant ("PRIMARY_PROPERTY_TYPE", Self.Option.name)

                .staticMethod ("option", function (spec, description, type, defval) // eslint-disable-line no-unused-vars
                {
                    let cls = this;
                    let opt = nit.new (Self.Option, arguments);

                    if (!opt.positional)
                    {
                        let shortFlags = [];

                        for (let o of cls.getProperties ())
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

                    return cls;
                })
                .staticMethod ("getPositionalOptions", function ()
                {
                    return this.getProperties ().filter (p => p.positional);
                })
                .staticMethod ("getOptionByFlag", function (flag)
                {
                    for (let opt of this.getProperties ())
                    {
                        if (opt.flag == flag)
                        {
                            return opt;
                        }
                    }
                })
                .staticMethod ("getOptionByShortFlag", function (shortFlag)
                {
                    for (let opt of this.getProperties ())
                    {
                        if (opt.shortFlag == shortFlag)
                        {
                            return opt;
                        }
                    }
                })
                .staticMethod ("getBooleanOptionByFlag", function (flag)
                {
                    let opt = this.getOptionByFlag (flag);

                    return opt && opt.type == "boolean" ? opt : undefined;
                })
                .staticMethod ("fromArgv", function (argv) // eslint-disable-line no-unused-vars
                {
                    let cls = this;

                    return new cls (cls.parseArgv (...arguments));
                })
                .staticMethod ("parseArgv", function (argv)
                {
                    let unchecked = nit.is.arr (argv) ? argv : (arguments.length ? nit.array (arguments) : nit.ARGV);

                    argv = [];

                    nit.each (unchecked, function (arg)
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
                    let arg;

                    cls.getProperties ()
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
                        options[opt.name] = opt.array
                            ? [].concat (nit.array (options[opt.name]), nit.array (value))
                            : (nit.is.arr (value) ? value.slice (-1)[0] : value)
                        ;
                    }


                    function getValue ()
                    {
                        let values = [];
                        let next = argv[0];

                        while (next !== undefined && next[0] != "-")
                        {
                            values.push (argv.shift ());
                            next = argv[0];
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

                            if (v === undefined)
                            {
                                v = getValue ();
                            }

                            if (k[1] == "-")
                            {
                                k = k.slice (2);
                                k = nit.kababCase (k);

                                let opt = optsByFlag[k];

                                if (opt)
                                {
                                    setOption (opt, opt.type == "boolean" && v === undefined ? true : v);
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
                                        if (opt.type == "boolean")
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
                .construct (function ()
                {
                    if (!this.input)
                    {
                        let ctxCls = this.constructor.name;
                        let cmdCls = nit.lookupClass (nit.kvSplit (ctxCls, ".", true).shift ());

                        if (cmdCls && cmdCls.Input)
                        {
                            this.input = new cmdCls.Input;
                        }
                    }
                })
            ;
        })
        .staticMethod ("defineInput", function (builder)
        {
            return this.defineInnerClass ("Input", this.Input.name, builder);
        })
        .staticMethod ("defineContext", function (builder)
        {
            return this.defineInnerClass ("Context", this.Context.name, builder);
        })
        .staticMethod ("run", async function (argv) // eslint-disable-line no-unused-vars
        {
            let cls = this;
            let options = cls.Input.parseArgv (...arguments);
            let input = new cls.Input (options);
            let ctx = await new cls.Context (input);
            let cmd = await new cls;

            try
            {
                return await cmd.run (ctx);
            }
            catch (e)
            {
                ctx.error = e;

                await cmd.catch (ctx);
            }
            finally
            {
                await cmd.finally (ctx);
            }
        })
        .abstractMethod ("run", /* istanbul ignore next */ function (ctx) // eslint-disable-line no-unused-vars
        {
        })
        .method ("catch", function (ctx)
        {
            throw ctx.error;
        })
        .method ("finally", function (ctx) // eslint-disable-line no-unused-vars
        {
        })
        .method ("confirm", async function (message, ...args)
        {
            return await nit.require ("nit.utils.Stdio").confirm (this.t (message, ...args));
        })
        .method ("log", function (message, ...args)
        {
            nit.log (this.t (message, ...args));
        })
    ;
};

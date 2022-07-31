module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Command"))
        .categorize ()
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
            ;
        })
        .defineInnerClass ("InputBase", function (InputBase)
        {
            InputBase
                .m ("error.grouped_non_boolean_flags", "Multiple non-boolean flags cannot be grouped together. (Given: %{flags})")
                .m ("error.short_flag_used", "The short flag '%{shortFlag}' has been used by the option '%{option}'.")
                .constant ("PROPERTY_TYPE", Self.Option.name)

                .staticMethod ("option", function (spec, description, type, defval) // eslint-disable-line no-unused-vars
                {
                    let cls = this;
                    let opt = nit.new (Self.Option, arguments);
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

                    opt.bind (cls.prototype);

                    return cls;
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
                .staticMethod ("fromArgv", function (argv)
                {
                    argv = (argv || nit.ARGV).slice ();

                    var cls = this;
                    var options = {};
                    var positionals = [];
                    var unrecognized = [];
                    var optsByShortFlag = {};
                    var optsByName = {};
                    var pargs = [];
                    var pargKeys = [];
                    var arg;

                    cls.getProperties ()
                        .forEach ((opt) =>
                        {
                            if (opt.ShortFlag)
                            {
                                optsByShortFlag[opt.ShortFlag] = opt;
                            }

                            if (opt.positional)
                            {
                                pargs.push (opt);
                                pargKeys.push (opt.name);
                            }

                            optsByName[opt.name] = opt;
                        })
                    ;

                    while ((arg = argv.shift ()))
                    {
                        var next = argv[0];
                        var name = null;

                        if (arg == "--")
                        {
                            positionals = positionals.concat (argv.splice (0));
                            break;
                        }
                        else
                        if (arg[0] == "-")
                        {
                            var names;

                            if (arg[1] == "-")
                            {
                                names = [nit.camelCase (arg.slice (2))];
                            }
                            else // short flags, possibly grouped
                            {
                                name = arg.slice (1);

                                let [ks, v] = nit.kvSplit (name, "=");

                                var nonBooleanFlags = [];

                                names = ks.split ("").map (function (n)
                                {
                                    var opt = optsByShortFlag[n];

                                    if (opt && opt.type != "boolean")
                                    {
                                        nonBooleanFlags.push (n);
                                    }

                                    return v ? (n + "=" + v) : n;
                                });

                                if (ks.length > 1 && nonBooleanFlags.length > 1)
                                {
                                    cls.throw ("error.grouped_non_boolean_flags", { flags: ks });
                                }
                            }

                            names.forEach (function (optn)
                            {
                                var name = optn;
                                var eqPos = name.indexOf ("=");
                                var val;

                                if (~eqPos)
                                {
                                    val = name.slice (eqPos + 1);
                                    name = name.slice (0, eqPos);
                                }

                                var nn = name.split (".");
                                var pn = nn.shift (); // the main property name
                                var opt = optsByName[pn] || optsByShortFlag[pn];

                                if (!opt)
                                {
                                    unrecognized.push ((optn.length > 1 ? "--" : "-") + nit.kababCase (optn));

                                    while (next !== undefined && next[0] != "-")
                                    {
                                        unrecognized.push (next);
                                        argv.shift ();
                                        next = argv[0];
                                    }

                                    return;
                                }

                                nn = nn.join (".");

                                if (~eqPos)
                                {
                                    if (nn.length)
                                    {
                                        val = nit.set ({}, nn, val);
                                    }

                                    options[opt.name] = val;
                                }
                                else
                                if (opt.type == "boolean")
                                {
                                    options[opt.name] = true;
                                }
                                else
                                {
                                    var values = [];

                                    while (next !== undefined && next[0] != "-")
                                    {
                                        if (nn.length)
                                        {
                                            next = nit.set ({}, nn, next);
                                        }

                                        values.push (next);
                                        argv.shift ();

                                        next = argv[0];

                                        if (!opt.array)
                                        {
                                            break;
                                        }
                                    }

                                    options[opt.name] = opt.array ? values : values[0];
                                }
                            });
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

                    if (positionals.length)
                    {
                        unrecognized.unshift.apply (unrecognized, positionals);
                    }

                    if (unrecognized.length)
                    {
                        argv.push.apply (argv, unrecognized);
                    }

                    return new cls (options);
                })
            ;
        })

        .defineInnerClass ("ContextBase", function (ContextBase)
        {
            ContextBase
                .defineInnerClass ("Registry")
                .field ("<input>", Self.InputBase.name, "The command input.")
                .staticMethod ("register", function (type, params) // or (obj)
                {
                    let cls = this;

                    if (nit.is.obj (type))
                    {
                        cls.memo ("@" + type.constructor.name, function ()
                        {
                            return type;
                        });
                    }
                    else
                    if (nit.is.str (type))
                    {
                        cls.memo ("@" + type, function ()
                        {
                            return nit.is.func (params) ? params.call (this) : nit.new (type, params);
                        });
                    }

                    return cls;
                })
                .method ("lookup", function (type, noCreate)
                {
                    let obj = this["@" + type];

                    if (!obj && !noCreate)
                    {
                        this.constructor.register (obj = nit.new (type));
                    }

                    return obj;
                })
            ;
        })
        .staticMethod ("defineInput", function (builder)
        {
            return this.defineInnerClass ("Input", Self.InputBase.name, builder);
        })
        .staticMethod ("defineContext", function (builder)
        {
            return this.defineInnerClass ("Context", Self.ContextBase.name, builder);
        })
        .do (function ()
        {
            this
                .defineInput ()
                .defineContext ()
            ;
        })
        .staticMethod ("run", async function (argv)
        {
            let cls = this;
            let input = cls.Input.fromArgv (argv);
            let ctx = new cls.Context (input);
            let cmd = await new cls;

            return await cmd.run (ctx);
        })
        .abstractMethod ("run", function (ctx) //  eslint-disable-line no-unused-vars
        {
        })
    ;
};

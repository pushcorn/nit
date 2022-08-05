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
                .m ("error.unknown_option", "The option '%{flag}' is unknown.")
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

                                let opt = optsByFlag[k];

                                if (opt)
                                {
                                    setOption (opt, v);
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

                    return new cls (options);
                })
            ;
        })

        .defineInnerClass ("ContextBase", function (ContextBase)
        {
            ContextBase
                .defineInnerClass ("Registry")
                .field ("[input]", Self.InputBase.name, "The command input.")
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
        .staticMethod ("run", function (argv)
        {
            let cls = this;
            let input = cls.Input.fromArgv (argv);
            let ctx = new cls.Context (input);

            return nit.Queue ()
                .push (function ()
                {
                    return new cls;
                })
                .push (function (qc)
                {
                    let cmd = qc.result;

                    return cmd.run (ctx);
                })
                .run ()
            ;
        })
        .abstractMethod ("run", /* istanbul ignore next */ function (ctx) // eslint-disable-line no-unused-vars
        {
        })
    ;
};

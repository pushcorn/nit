module.exports = function (nit, Self)
{
    let writer = new nit.Object.Property.Writer;

    return (Self = nit.defineClass ("nit.Command"))
        .require ("nit.Subcommand")
        .k ("context")
        .defineMeta ("description", "string", "Command description unavailable.")
        .defineMeta ("outputType", "string")
        .categorize ("commands")
        .use ("nit.utils.HelpBuilder")
        .plugin ("lifecycle-component", "run")
        .plugin ("compgen-completer")
        .registerStringTypeParser ("command")
        .defineCompgenCompleter (Completer =>
        {
            Completer
                .completeForType ("command", ctx => [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (nit.listCommands (true))])
            ;
        })
        .staticMethod ("describe", function (description, outputType)
        {
            return this.meta ({ description, outputType });
        })
        .staticMethod ("buildPropertyDescription", function (p, defvals)
        {
            let defval = p.name in defvals ? defvals[p.name] : p.defval;

            return p.description + ((p.required || p.array || p.type == "boolean" || nit.is.obj (defval) || nit.is.func (defval) || nit.is.empty (defval)) ? "" : "\n{ default: " + defval + " }");
        })
        .staticMethod ("buildPargsTable", function (builder, pargs, defvals)
        {
            if (pargs.length)
            {
                builder.table (pargs.map (p =>
                {
                    let cols =
                    [
                        " " + p.helpSpec,
                        Self.buildPropertyDescription (p, defvals)
                    ];

                    return { cols };
                }));
            }

            return builder;
        })
        .staticMethod ("buildNargsTable", function (builder, nargs, defvals)
        {
            if (nargs.length)
            {
                builder.table (nargs.map (p =>
                {
                    let cols =
                    [
                        " " + (p.shortFlag ? "-" + p.shortFlag + ", " : "    ") + p.helpSpec,
                        Self.buildPropertyDescription (p, defvals)
                    ];

                    return { cols };
                }));
            }

            return builder;
        })
        .staticMethod ("help", function (subcommand)
        {
            let cmd = this;
            let help = new Self.HelpBuilder;
            let Input = cmd.Input;
            let defvals = Input.defaults ();
            let scOpt = Input.subcommandOption;
            let Subcommand = scOpt && scOpt.class;
            let pargs = Input.pargs.slice ();
            let opts = Input.nargs.slice ();

            opts.sort ((a, b) => a.flag.localeCompare (b.flag));

            let subcommandClass = subcommand && Subcommand?.lookup (subcommand);

            if (subcommandClass)
            {
                pargs = pargs.filter (p => p != scOpt);

                help.paragraph (subcommandClass.help (cmd).build ());
            }
            else
            {
                help
                    .paragraph (cmd.description)
                    .paragraph ("Usage: nit "
                        + nit.getComponentDescriptor (cmd).name
                        + (pargs.length ? " " + pargs.map (p => p.helpSpec).join (" ") : "")
                    )
                ;
            }

            if (opts.length + pargs.length)
            {
                help.paragraph ((subcommandClass ? "Command " : "") +  "Options:");

                Self.buildPargsTable (help, pargs, defvals);
                Self.buildNargsTable (help, opts, defvals);
            }

            if (!subcommand && Subcommand)
            {
                let subcommands = Subcommand.listSubcommands ();

                if (subcommands.length)
                {
                    help.paragraph ("Available subcommands:")
                        .table (subcommands
                        .sort ((a, b) => a.compareTo (b))
                        .map (c => ({ cols: [" " + c.name, nit.trim (c.class.description)] }))
                    );
                }
                else
                {
                    help.paragraph ("No subcommands available.");
                }
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
                .m ("error.unclosed_quote", "The line was not closed with a matching quote: %{line}")
                .constant ("PRIMARY_PROPERTY_TYPE", Self.Option.name)
                .constant ("TRUTHY_VALUES", ["true", "yes", "1"])
                .constant ("FALSY_VALUES", ["false", "no", "0"])
                .constant ("BOOLEAN_VALUES", Input.TRUTHY_VALUES.concat (Input.FALSY_VALUES))
                .staticProperty ("subcommandOption", Self.Option.name, { writer })

                .staticGetter ("options", "properties")
                .staticGetter ("optionMap", "propertyMap")
                .staticMethod ("tokenize", function (line) // simple command-line tokenizer
                {
                    let uid = nit.uuid ();
                    let singleQuoteEsc = "<sq-" + uid + ">";
                    let doubleQuoteEsc = "<dq-" + uid + ">";
                    let singleQuoteEscRe = new RegExp (nit.escapeRegExp (singleQuoteEsc), "g");
                    let doubleQuoteEscRe = new RegExp (nit.escapeRegExp (doubleQuoteEsc), "g");

                    line = nit.trim (line)
                        .replace (/\\'/g, singleQuoteEsc)
                        .replace (/\\"/g, doubleQuoteEsc)
                    ;

                    let index = 0;
                    let quote;
                    let tokens = [];
                    let filtered = [];

                    line.replace (/\s+/g, function (match, idx)
                    {
                        let token = line.slice (index, idx);

                        index = idx + match.length;

                        tokens.push (token, match);
                    });

                    tokens.push (line.slice (index));

                    tokens.forEach ((t, q) =>
                    {
                        if (quote)
                        {
                            filtered[filtered.length - 1] += t;

                            if (t.slice (-1) == quote)
                            {
                                filtered[filtered.length - 1] = nit.trim (filtered[filtered.length - 1], quote);
                                quote = "";
                            }
                        }
                        else
                        {
                            if ((q = t.match (/^["']/)))
                            {
                                quote = q[0];

                                if (t.slice (-1) == quote)
                                {
                                    t = nit.trim (t, quote);
                                    quote = "";
                                }
                            }
                            else
                            if (!(t = t.trim ()).length)
                            {
                                return;
                            }

                            filtered.push (t);
                        }
                    });

                    filtered = filtered.map (t => t.replace (singleQuoteEscRe, "'").replace (doubleQuoteEscRe, '"'));

                    if (quote)
                    {
                        this.throw ("error.unclosed_quote", { line: filtered.pop () });
                    }

                    return filtered;
                })
                .staticMethod ("option", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
                {
                    let cls = this;
                    let opt = nit.new (Self.Option, arguments);
                    let scOpt = cls.subcommandOption;
                    let isSubcommand = nit.is.subclassOf (opt.class, nit.Subcommand);

                    if (scOpt)
                    {
                        if (isSubcommand)
                        {
                            cls.throw ("error.only_one_subcommand_allowed",
                            {
                                defined: cls.fields.find (o => nit.is.subclassOf (o.class, nit.Subcommand)).name + ", " + opt.name
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

                    let parg;
                    let arrParg;

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

        .defineInnerClass ("Context", "nit.Context", function (Context)
        {
            Context
                .field ("[input]", Self.Input.name, "The command input.")
                .field ("exitCode", "integer", "The command exit code.")
                .field ("error", "Error", "The error thrown by the run method.")
                .field ("output", "any", "The command output.")
                .property ("command", "nit.Command")

                .staticMethod ("forInput", function (...options)
                {
                    let cls = this;
                    let inputClass = cls.outerClass.Input;

                    return new cls (inputClass && inputClass.fromArgv (...options));
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
        .staticMethod ("defineSubcommand", function (builder)
        {
            let cls = this;

            return cls.defineInnerClass (cls.simpleName + "Subcommand", "nit.Subcommand", Subcommand =>
            {
                builder?.call (cls, Subcommand);

                cls.constant ("Subcommand", Subcommand);
            });
        })
        .staticMethod ("exec", async function (/* command string */)
        {
            let argv = nit.array (arguments, true);

            if (argv.length == 1) // command string
            {
                argv = Self.Input.tokenize (argv[0]);
            }

            let cls = nit.lookupCommand (argv.shift ());

            return await cls ().run (...argv);
        })
        .onDefineSubclass (Subclass =>
        {
            Subclass.defineInput ();
            Subclass.defineContext ();
        })
        .configureComponentMethod ("run", true, function (Queue, method)
        {
            Queue.after (method + ".invokeHook", method + ".checkResult", function (cmd, ctx)
            {
                ctx.output = nit.coalesce (this.result, ctx.output);
                this.result = undefined;
            });
        })
        .configureComponentMethods ("run", function (Queue)
        {
            Queue
                .onInit (function (cmd)
                {
                    let cls = cmd.constructor;
                    let args = this.args;
                    let ctx = args[0] instanceof cls.Context ? args.shift () : new cls.Context;

                    this.args = ctx;

                    ctx.command = cmd;

                    if (!ctx.input)
                    {
                        ctx.input = cls.Input.fromArgv (...args);
                    }
                })
                .after ("run.checkResult", "run.castOutput", function (cmd, ctx)
                {
                    let cls = cmd.constructor;

                    if (cls.outputType)
                    {
                        ctx.output = nit.new (cls.outputType, ctx.output);
                    }
                })
                .onComplete (function (cmd, ctx) { return ctx; })
                .onRun (nq =>
                {
                    nq
                        .failure (nit.invoke.wrap.before ([nq, nq.onFailure], function ([q])
                        {
                            Object.setPrototypeOf (q.error, Error.prototype); // In test mode, native errors are not instances of Error.
                        }))
                        .complete (nit.invoke.wrap.after ([nq, nq.onComplete], function (e, r, q)
                        {
                            let [ctx] = q.args;

                            if ((ctx.error = nit.coalesce (e, q.error)))
                            {
                                ctx.exitCode = Math.max (ctx.exitCode, 1);

                                nit.dpv (ctx.error, Self.kContext, ctx, true, false);

                                throw ctx.error;
                            }
                        }))
                    ;
                })
            ;
        })
        .method ("confirm", async function (message, ...args)
        {
            return await nit.require ("nit.utils.Stdio").confirm (this.t (message, ...args));
        })
    ;
};

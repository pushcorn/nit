module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Compgen"))
        .constant ("QUOTE_PATTERN", /["']/)
        .constant ("REDIRECT_PATTERN", /^[0-9&<>]+$/)
        .constant ("ESCAPED_CHARS", /([\s\\="'&();<>|~`])/g)
        .constant ("STATES", nit.index (["command", "subcommand", "option", "value", "redirect", "none"]))
        .constant ("ACTIONS", nit.index (["COMMAND", "SUBCOMMAND", "OPTION", "VALUE", "NONE", "FILE", "DIR"]))
        .constant ("COMPLETION_TYPES", nit.index (["redirect", "type", "constraint", "option"]))
        .require ("nit.CompgenCompleter")

        .defineInnerClass ("Context", function (Context)
        {
            Context
                .field ("quote", "string", "The last unclosed quote.")
                .field ("compLine", "string", "The current command line.")
                .field ("compPoint", "integer", "The index of the current cursor position relative to the beginning of the current command.")
                .field ("compType", "integer", "Set to an integer value corresponding to the type of completion attempted that caused a completion function to be called.")
                .getter ("compTypeChar", function () { return String.fromCharCode (this.compType); })
                .field ("compKey", "string", "The key (or final key of a key sequence) used to invoke the current completion function.")
                .field ("compWords...", "string*", "Tokenized words.")
                .field ("compWordIndexes...", "integer", "The start position of each word in compLine.")
                .field ("compCword", "integer", "The current word.")
                .field ("cur", "string", "The current word.")
                .field ("completionType", "string", "The type of the completions that should be generated.")
                    .constraint ("choice", ...nit.keys (Self.COMPLETION_TYPES))

                .getter ("completing", function () // true if the character before the cursor is not a whitespace
                {
                    return !this.compLine[this.compPoint - 1].match (/\s/);
                })
                .getter ("subcommandOption", function ()
                {
                    return this.commandClass?.Input.subcommandOption;
                })
                .getter ("targetClass", function ()
                {
                    return this.subcommandClass || this.commandClass;
                })

                .field ("prev", "string", "The previous word.")
                .field ("state", "string", "The parsing state.")
                    .constraint ("choice", ...nit.values (Self.STATES))
                .field ("currentCommand", "string", "The current command that's being completed.",
                {
                    setter: function (command)
                    {
                        try
                        {
                            this.commandClass = nit.lookupCommand (command);
                        }
                        catch (e)
                        {
                            this.commandClass = undefined;
                        }

                        return command;
                    }
                })
                .field ("commandClass", "function", "The command class.")
                    .constraint ("subclass", "nit.Command")

                .field ("currentSubcommand", "string", "The current subcommand that's being completed.",
                {
                    setter: function (subcommand)
                    {
                        try
                        {
                            this.subcommandClass = this.subcommandOption.class.lookup (subcommand);
                        }
                        catch (e)
                        {
                            this.subcommandClass = undefined;
                        }

                        return subcommand;
                    }
                })
                .field ("subcommandClass", "function", "The subcommand class.")
                    .constraint ("subclass", "nit.Subcommand")

                .field ("currentFlag", "string", "The current flag that's being completed.",
                {
                    setter: function (flag)
                    {
                        if (flag)
                        {
                            this.currentOption = this.targetClass?.Input.getOptionByFlag (flag);
                        }
                        else
                        {
                            this.currentOption = undefined;
                        }

                        return flag;
                    }
                })
                .field ("shortFlags", "string", "The current short flags that are being completed.")
                .field ("currentOption", "nit.Command.Option", "The current option that's being completed.")
                .field ("currentValue", "string", "The current option value that's being completed.",
                {
                    setter: function (v)
                    {
                        let opt = this.currentOption;

                        if (opt)
                        {
                            this.specifiedValues[opt.name] = opt.array ? nit.array (this.specifiedValues[opt.name]).concat (v).filter (nit.is.not.empty) : v;
                        }

                        return v;
                    }
                })
                .field ("currentConstraint", "nit.Constraint", "The current constraint that's being completed.")
                .field ("specifiedOptions...", "string", "The options specified the user.")
                .field ("specifiedValues", "object", "The option values specified the user.")

                .onConstruct (function ()
                {
                    let { compLine, compWords } = this;
                    let lastIndex = 0;

                    for (let word of compWords)
                    {
                        let index = compLine.indexOf (word, lastIndex);

                        this.compWordIndexes.push (index);
                        lastIndex += word.length;

                        let ws = compLine.slice (lastIndex).match (/\s+/);

                        if (ws)
                        {
                            lastIndex += ws[0].length;
                        }
                    }
                })
                .method ("filterCompletions", function (completions)
                {
                    return completions.filter (c => c.startsWith (this.currentValue));
                })
                .method ("getNextPositionalOption", function ()
                {
                    return nit.find (this.targetClass?.Input.getPositionalOptions (), o => o.type != "boolean" && (o.array || !this.specifiedOptions.includes (o.flag)));
                })
                .method ("findConstraint", function (type)
                {
                    type = nit.lookupClass (type);

                    let opt;
                    let opts = nit.array (this.currentOption);

                    while ((opt = opts.shift ()))
                    {
                        for (let c of nit.array (opt.constraints))
                        {
                            if (c instanceof type)
                            {
                                return c;
                            }
                        }

                        if ((opt = opt.class?.fields[0]))
                        {
                            opts.push (opt);
                        }
                    }
                })
            ;
        })

        .staticMethod ("dequote", function (str)
        {
            let quote = str && str[0].match (Self.QUOTE_PATTERN);

            quote = quote && quote[0];

            return quote ? str.slice (1, str.slice (-1) == quote ? -1 : str.length) : str;
        })
        .staticMemo ("completers", function ()
        {
            return nit.lookupComponents (nit.CompgenCompleter)
                .sort ((a, b) => a.priority - b.priority)
            ;
        })
        .field ("context", Self.Context.name)

        .onConstruct (function ()
        {
            let [, cur, prev] = nit.ARGV;
            let { COMP_LINE: compLine, COMP_KEY: compKey, COMP_POINT: compPoint, COMP_TYPE: compType, COMP_CWORD: compCword } = nit.ENV;

            let compWords = [];

            for (let i = 0, j = nit.ENV.COMP_NUM_WORDS; i < j; ++i)
            {
                compWords.push (nit.ENV["COMP_WORD_" + i]);
            }

            let quote = cur && cur[0].match (Self.QUOTE_PATTERN) || "";

            if (quote)
            {
                quote = quote[0];
            }

            this.context = new Self.Context (
            {
                cur, prev,
                compLine, compKey,
                compPoint, compType,
                compWords, compCword,
                quote
            });
        })

        .method ("parseWords", function ()
        {
            const { STATES } = Self;
            const { context: ctx } = this;
            const { compWords: words, compWordIndexes, compPoint } = ctx;

            for (let i = 1; i < words.length; ++i)
            {
                let word = words[i];
                let next = words[i + 1];
                let current = compWordIndexes[i] < compPoint;
                let dashes, flag, option;

                if (current)
                {
                    if (word.match (Self.REDIRECT_PATTERN))
                    {
                        ctx.state = words[i + 2] === "" ? STATES.none : STATES.redirect;
                        return;
                    }

                    if (word == "--" && words[i + 1] === "")
                    {
                        ctx.state = STATES.none;
                        return;
                    }
                }

                if ((dashes = word.match (/^(--?)([^-].*)?/)))
                {
                    flag = dashes[2] || "";
                    dashes = dashes[1];

                    if (current)
                    {
                        ctx.shortFlags = "";
                        ctx.state = STATES.option;

                        if (dashes.length == 1 && flag)
                        {
                            let hasNonBooleanFlags = false;

                            for (let ch of flag.split (""))
                            {
                                ctx.currentFlag = ctx.targetClass?.Input.getOptionByShortFlag (ch)?.flag;

                                if ((option = ctx.currentOption))
                                {
                                    if (!hasNonBooleanFlags)
                                    {
                                        ctx.shortFlags += option.shortFlag;

                                        if (!option.array)
                                        {
                                            ctx.specifiedOptions.push (option.flag);
                                        }
                                    }

                                    hasNonBooleanFlags = option.type != "boolean";
                                }
                            }
                        }
                        else
                        {
                            ctx.currentFlag = flag;

                            if ((option = ctx.currentOption) && !option.array)
                            {
                                ctx.specifiedOptions.push (option.flag);
                            }
                        }

                        if ((option = ctx.currentOption))
                        {
                            if (option.type != "boolean")
                            {
                                while (next && next[0] != "-")
                                {
                                    if (compWordIndexes[i + 1] < compPoint)
                                    {
                                        ctx.state = STATES.value;
                                        ctx.currentValue = Self.dequote (next);
                                    }

                                    ++i;

                                    if (option.array)
                                    {
                                        next = words[i + 1];
                                    }
                                    else
                                    {
                                        break;
                                    }
                                }
                            }
                            else
                            {
                                ctx.currentValue = true;
                            }
                        }
                    }
                    else
                    if (flag)
                    {
                        let opt;

                        if (dashes.length == 1)
                        {
                            for (let ch of flag.split (""))
                            {
                                if ((opt = ctx.targetClass?.Input.getOptionByShortFlag (ch)) && !opt.array)
                                {
                                    ctx.specifiedOptions.push (opt.flag);
                                }
                            }
                        }
                        else
                        if ((opt = ctx.targetClass?.Input.getOptionByFlag (flag)) && !opt.array)
                        {
                            ctx.specifiedOptions.push (opt.flag);
                        }
                    }
                }
                else
                if (!ctx.currentCommand
                    && (ctx.cur && ctx.cur === word || (words.length > 2 && i < words.length)))
                {
                    ctx.currentCommand = word;
                    ctx.state = STATES.command;
                }
                else
                if (ctx.subcommandOption
                    && !ctx.currentSubcommand
                    && word
                    && current
                    && (!ctx.completing || ctx.cur != word || i == words.length - 1))
                {
                    ctx.currentFlag = ctx.subcommandOption.name;
                    ctx.currentValue = word;

                    ctx.currentSubcommand = word;
                    ctx.state = STATES.subcommand;
                    ctx.specifiedOptions = [];
                    ctx.currentFlag = "";
                }
                else
                if (word && current)
                {
                    let popt = ctx.getNextPositionalOption ();

                    if (popt)
                    {
                        ctx.currentFlag = popt.flag;
                        ctx.specifiedOptions.push (popt.flag);
                        ctx.state = STATES.value;
                        ctx.currentValue = Self.dequote (word);
                    }
                    else
                    {
                        ctx.state = STATES.none;
                        return;
                    }
                }
            }

            if (!ctx.completing)
            {
                switch (ctx.state)
                {
                    case STATES.command:
                    case STATES.subcommand:
                        ctx.state = STATES.option;
                        break;

                    case STATES.option:
                        if (ctx.currentFlag)
                        {
                            ctx.currentFlag += "";
                        }

                        if (ctx.currentOption)
                        {
                            if (ctx.currentOption.type == "boolean")
                            {
                                let popt = ctx.getNextPositionalOption ();

                                if (popt)
                                {
                                    if (popt == ctx.subcommandOption)
                                    {
                                        ctx.state = STATES.subcommand;
                                    }
                                    else
                                    {
                                        ctx.state = STATES.value;
                                    }

                                    ctx.currentFlag = popt.flag;
                                    ctx.specifiedOptions.push (popt.flag);
                                    ctx.currentValue = "";
                                }
                                else
                                {
                                    ctx.currentFlag = "";
                                }
                            }
                            else
                            {
                                ctx.state = STATES.value;
                                ctx.currentValue = "";
                            }
                        }
                        break;

                    case STATES.value:
                        if (!ctx.currentOption?.positional || !ctx.currentOption?.array)
                        {
                            let popt = ctx.getNextPositionalOption ();

                            if (popt)
                            {
                                if (popt == ctx.subcommandOption)
                                {
                                    ctx.state = STATES.subcommand;
                                }

                                ctx.currentFlag = popt.flag;
                                ctx.specifiedOptions.push (popt.flag);
                                ctx.currentValue = "";
                            }
                            else
                            {
                                ctx.state = STATES.option;
                                ctx.currentFlag = "";
                            }
                        }
                        break;

                    default:
                        ctx.state = STATES.command;
                }
            }
        })

        .method ("invokeCompleters", async function (type)
        {
            this.context.completionType = type;

            for (let c of Self.completers)
            {
                let completions = await c.generate (this.context);

                if (completions)
                {
                    return completions;
                }
            }
        })
        .method ("listCompletions", async function ()
        {
            const { context: ctx } = this;
            const { STATES, ACTIONS } = Self;

            let completions = [];

            switch (ctx.state)
            {
                case STATES.redirect:
                    completions = await this.invokeCompleters ("redirect");
                    break;

                case STATES.command:
                    completions = [ACTIONS.COMMAND];

                    nit.listCommands ().forEach (function (c)
                    {
                        if (c.name.startsWith (ctx.currentCommand))
                        {
                            completions.push (c.name);
                        }
                    });
                    break;

                case STATES.subcommand:
                    completions = [ACTIONS.SUBCOMMAND, ...ctx.subcommandOption.class.listSubcommands (true).filter (n => n.startsWith (ctx.currentValue))];
                    break;

                case STATES.option:
                    completions = [ACTIONS.OPTION];

                    if (ctx.completing && ctx.shortFlags)
                    {
                        completions.push ("-" + ctx.shortFlags);
                    }
                    else
                    if (ctx.targetClass)
                    {
                        if (ctx.completing || ctx.specifiedOptions.length || ctx.currentFlag)
                        {
                            for (let o of ctx.targetClass.Input.fields)
                            {
                                if (o != ctx.subcommandOption
                                    && o.flag.startsWith (ctx.currentFlag)
                                    && (!ctx.specifiedOptions.includes (o.flag) || o.flag == ctx.currentFlag))
                                {
                                    completions.push ("--" + o.flag);
                                }
                            }
                        }
                        else
                        {
                            let opt = ctx.getNextPositionalOption ();

                            if (opt)
                            {
                                ctx.currentFlag = opt.flag;
                                ctx.specifiedOptions.push (opt.flag);
                                ctx.state = STATES.value;

                                return await this.listCompletions ();
                            }
                            else
                            if ((opt = ctx.targetClass.Input.fields[0]))
                            {
                                completions.push ("--" + opt.flag);
                            }
                        }
                    }
                    break;

                case STATES.value:
                    completions = await this.invokeCompleters ("option")
                        || await this.invokeCompleters ("constraint")
                        || await this.invokeCompleters ("type")
                        || [ACTIONS.VALUE];
                    break;

                default:
                    completions = [ACTIONS.NONE];
            }

            return completions;
        })
        .method ("run", async function ()
        {
            this.parseWords ();

            (await this.listCompletions ()).forEach (c => console.log (c));
        })
    ;
};

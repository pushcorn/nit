module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Compgen"))
        .require ("nit.compgen.Completer")
        .constant ("QUOTE_PATTERN", /["']/)
        .constant ("REDIRECT_PATTERN", /^[<>]/)
        .constant ("ESCAPED_CHARS", /([\s\\="'&();<>|~`])/g)
        .constant ("STATES", nit.index (["command", "option", "value"]))
        .constant ("ACTIONS", nit.index (["COMMAND", "OPTION", "VALUE", "FILE"]))

        .defineInnerClass ("Context", function (Context)
        {
            Context
                .field ("quote", "string", "The last unclosed quote.")
                .field ("compLine", "string", "The current command line.")
                .field ("compPoint", "integer", "The index of the current cursor position relative to the beginning of the current command.")
                .field ("compType", "integer", "Set to an integer value corresponding to the type of completion attempted that caused a completion function to be called.")
                .getter ("compTypeChar", function () { return String.fromCharCode (this.compType); })
                .field ("compKey", "string", "The key (or final key of a key sequence) used to invoke the current completion function.")
                .field ("compWords...", "string", "Tokenized words.")
                .field ("compCword", "integer", "The current word.")
                .field ("cur", "string", "The current word.")
                .getter ("completing", function () // is the word being completed?
                {
                    return this.cur != "";
                })

                .field ("prev", "string", "The previous word.")
                .field ("state", "string", "The parsing state.")
                    .constraint ("choice", ...nit.values (Self.STATES))
                .field ("currentCommand", "string", "The current command that's being completed.",
                {
                    setter: function (command)
                    {
                        let cmd;

                        if (command && (cmd = nit.find (nit.listCommands (), "cn", command)))
                        {
                            this.commandClass = nit.require (cmd.path);
                        }
                        else
                        {
                            this.commandClass = undefined;
                        }

                        return command;
                    }
                })
                .field ("commandClass", "function", "The command class.")
                    .constraint ("subclass", "nit.Command")

                .field ("currentFlag", "string", "The current flag that's being completed.",
                {
                    setter: function (flag)
                    {
                        if (flag)
                        {
                            this.currentOption = this.commandClass?.Input?.getOptionByFlag (flag);
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
                .field ("currentValue", "string", "The current option value that's being completed.")
                .field ("specifiedOptions...", "string", "The options specified the user.")
            ;
        })

        .staticMethod ("dequote", function (str)
        {
            let quote = str && str[0].match (Self.QUOTE_PATTERN);

            quote = quote && quote[0];

            return quote ? str.slice (1, str.slice (-1) == quote ? -1 : str.length) : str;
        })

        .memo ("completers", function ()
        {
            return nit.listSubclassesOf (nit.compgen.Completer)
                .map (g => new g)
                .sort ((a, b) => a.order - b.order)
            ;
        })
        .field ("context", Self.Context.name)

        .construct (function ()
        {
            let [, cur, prev] = nit.ARGV;
            let { COMP_LINE: compLine, COMP_KEY: compKey, COMP_POINT: compPoint, COMP_TYPE: compType, COMP_CWORD: compCword } = nit.ENV;

            let compWords = [];

            for (let i = 0, j = nit.ENV.COMP_NUM_WORDS; i < j; ++i)
            {
                compWords.push (nit.ENV["COMP_WORD_" + i] ?? "");
            }

            let quote = cur && cur[0].match (Self.QUOTE_PATTERN) || "";

            if (quote)
            {
                quote = quote[0];
            }

            if (cur == "" && compCword > 0)
            {
                --compCword;
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

            let words = ctx.compWords;

            for (let i = 1; i < words.length; ++i)
            {
                let word = words[i];
                let current = i <= ctx.compCword;
                let dashes, flag, option, next;

                if ((dashes = word.match (/^(--?)([^-].*)?/)))
                {
                    flag = dashes[2] || "";
                    dashes = dashes[1];

                    if (current)
                    {
                        ctx.shortFlags = "";
                        ctx.state = STATES.option;

                        if (dashes.length == 1)
                        {
                            let hasNonBooleanFlags = false;

                            for (let ch of flag.split (""))
                            {
                                ctx.currentFlag = ctx.commandClass?.Input?.getOptionByShortFlag (ch)?.flag;

                                if ((option = ctx.currentOption))
                                {
                                    if (!hasNonBooleanFlags)
                                    {
                                        ctx.shortFlags += option.shortFlag;
                                        ctx.specifiedOptions.push (option.flag);
                                    }

                                    hasNonBooleanFlags = option.type != "boolean";
                                }
                            }
                        }
                        else
                        {
                            ctx.currentFlag = flag;

                            if ((option = ctx.currentOption))
                            {
                                ctx.specifiedOptions.push (option.flag);
                            }
                        }

                        if ((option = ctx.currentOption))
                        {
                            if (option.type != "boolean")
                            {
                                next = words[i + 1];

                                if (next !== undefined && next[0] != "-")
                                {
                                    if (i + 1 <= ctx.compCword)
                                    {
                                        ctx.state = STATES.value;
                                        ctx.currentValue = Self.dequote (next);
                                    }

                                    ++i;
                                }
                            }
                            else
                            {
                                ctx.currentValue = "";
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
                                if ((opt = ctx.commandClass?.Input?.getOptionByShortFlag (ch)))
                                {
                                    ctx.specifiedOptions.push (opt.flag);
                                }
                            }
                        }
                        else
                        if ((opt = ctx.commandClass?.Input?.getOptionByFlag (flag)))
                        {
                            ctx.specifiedOptions.push (opt.flag);
                        }
                    }
                }
                else
                if (!ctx.currentCommand)
                {
                    if (current)
                    {
                        ctx.state = STATES.command;
                        ctx.currentCommand = word;
                    }
                }
            }

            if (!ctx.completing)
            {
                switch (ctx.state)
                {
                    case STATES.command:
                        if (ctx.currentCommand)
                        {
                            ctx.state = STATES.option;
                        }
                        break;

                    case STATES.option:
                        if (ctx.currentOption)
                        {
                            if (ctx.currentOption.type == "boolean")
                            {
                                ctx.currentFlag = "";
                            }
                            else
                            {
                                ctx.state = STATES.value;
                                ctx.currentValue = "";
                            }
                        }
                        break;

                    case STATES.value:
                        if (ctx.currentValue)
                        {
                            ctx.state = STATES.option;
                            ctx.currentFlag = "";
                        }
                        break;

                    default:
                        ctx.state = STATES.command;
                }
            }
        })

        .method ("invokeCompleters", async function (method)
        {
            for (let c of this.completers)
            {
                let completions = await c[method] (this.context);

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

            let completions;

            if ((ctx.prev.match (Self.REDIRECT_PATTERN)
                    || (!ctx.quote && ctx.cur.match (Self.REDIRECT_PATTERN)))
                && (completions = await this.invokeCompleters ("completeForRedirect")))
            {
                return completions;
            }

            this.parseWords ();

            switch (ctx.state)
            {
                case STATES.command:
                    completions = [ACTIONS.COMMAND];

                    nit.listCommands ().forEach (function (c)
                    {
                        if (c.cn.startsWith (ctx.currentCommand))
                        {
                            completions.push (c.cn);
                        }
                    });
                    break;

                case STATES.option:
                    completions = [ACTIONS.OPTION];

                    if (ctx.completing && ctx.shortFlags)
                    {
                        completions.push ("-" + ctx.shortFlags);
                    }
                    else
                    if (ctx.specifiedOptions.length || ctx.currentOption)
                    {
                        for (let o of ctx.commandClass.Input.getProperties ())
                        {
                            if (o.flag.startsWith (ctx.currentFlag)
                                && (!ctx.specifiedOptions.includes (o.flag) || o.flag == ctx.currentFlag))
                            {
                                completions.push ("--" + o.flag);
                            }
                        }
                    }
                    else
                    if (ctx.commandClass)
                    {
                        let popts = [];
                        let opts = ctx.commandClass.Input.getProperties ().map (o =>
                        {
                            if (o.positional)
                            {
                                popts.push (o);
                            }

                            return o;
                        });

                        if (opts.length)
                        {
                            completions.push ("--" + (popts.length ? popts : opts)[0].flag);
                        }
                    }
                    break;

                case STATES.value:
                    completions = await this.invokeCompleters ("completeForType")
                        || await this.invokeCompleters ("completeForConstraint")
                        || [];
                    break;
            }

            return completions;
        })
        .method ("run", async function ()
        {
            (await this.listCompletions ()).forEach (c => console.log (c));
        })
    ;
};

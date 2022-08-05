module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Compgen"))
        .require ("nit.Command")
        .require ("nit.compgen.Completer")
        .constant ("QUOTE_PATTERN", /["']/)
        .constant ("REDIRECT_PATTERN", /^[0-9&<>]+$/)
        .constant ("ESCAPED_CHARS", /([\s\\="'&();<>|~`])/g)
        .constant ("STATES", nit.index (["command", "option", "value", "redirect", "none"]))
        .constant ("ACTIONS", nit.index (["COMMAND", "OPTION", "VALUE", "NONE", "FILE"]))

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
                .field ("compWordIndexes...", "integer", "The start position of each word in compLine.")
                .field ("compCword", "integer", "The current word.")
                .field ("cur", "string", "The current word.")
                .getter ("completing", function () // true if the character before the cursor is not a whitespace
                {
                    return !this.compLine[this.compPoint - 1].match (/\s/);
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

                .construct (function ()
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

            if (ctx.state)
            {
                return;
            }

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
                                if (next && next[0] != "-")
                                {
                                    if (compWordIndexes[i + 1] < compPoint)
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
                if (!ctx.currentCommand
                    && (ctx.cur && ctx.cur === word || (words.length > 2 && i < words.length)))
                {
                    ctx.currentCommand = word;
                    ctx.state = STATES.command;
                }
                else
                if (word && current)
                {
                    ctx.state = STATES.none;
                    return;
                }
            }


            if (!ctx.completing)
            {
                switch (ctx.state)
                {
                    case STATES.command:
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
                        ctx.state = STATES.option;
                        ctx.currentFlag = "";
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

            let completions = [];

            this.parseWords ();

            switch (ctx.state)
            {
                case STATES.redirect:
                    completions = await this.invokeCompleters ("completeForRedirect");
                    break;

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
                    if (ctx.commandClass)
                    {
                        if (ctx.specifiedOptions.length || ctx.currentFlag)
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
                    }
                    break;

                case STATES.value:
                    completions = await this.invokeCompleters ("completeForType")
                        || await this.invokeCompleters ("completeForConstraint")
                        || [ACTIONS.VALUE];
                    break;

                default:
                    completions = [ACTIONS.NONE];
            }

            return completions;
        })
        .method ("run", async function ()
        {
            (await this.listCompletions ()).forEach (c => console.log (c));
        })
    ;
};

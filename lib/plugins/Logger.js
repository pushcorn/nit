module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("Logger"))
        .k ("logger")
        .use ("nit.utils.String")
        .use ("nit.utils.Colorizer")
        .staticProperty ("timestamp", "boolean?") // prepend timestamp

        .field ("openTag", "string", "The template's open tag.", "%{")
        .field ("closeTag", "string", "The template's close tag.", "}")
        .field ("stackTrace", "boolean", "Whether to the stack trace")
        .field ("timestamp", "boolean?", "Whether to show the timestamp")
        .field ("transforms", "object", "The transforms.", { defval: { nit } })
        .field ("levelColors", "object", "The prefix colors by log levels.",
        {
            defval:
            {
                info: "green",
                warn: "yellow",
                error: "red"
            }
        })

        .memo ("timestampEnabled", function ()
        {
            return nit.is.bool (this.timestamp)
                ? this.timestamp
                : (nit.is.bool (this.constructor.timestamp) ? this.constructor.timestamp : false)
            ;
        })
        .getter ("prefix", function ()
        {
            return this.timestampEnabled ? (nit.timestamp () + " ") : "";
        })
        .getter ("stack", function ()
        {
            return this.stackTrace
                ?  "\n" + new Error ().stack.split ("\n").slice (3).join ("\n")
                : ""
            ;
        })
        .method ("registerTransform", function (name, func)
        {
            this.transforms[name] = func;

            return this;
        })
        .method ("formatMessage", function (host, message, ...args) // eslint-disable-line no-unused-vars
        {
            let cls = host.constructor;

            if (typeof message == "string")
            {
                message = cls.t (message);

                let p = nit.format.parse ([message].concat (args));

                return nit.Template.render (message, p.data, this);
            }
            else
            if (message instanceof Error)
            {
                return message.stack;
            }
            else
            {
                return JSON.stringify (message);
            }
        })
        .defineInnerClass ("Mixin", Mixin =>
        {
            Mixin
                .staticGetter ("logger", function ()
                {
                    return this[Self.kLogger];
                })
                .method ("log", function (message, ...args)
                {
                    let host = this;
                    let cls = host.constructor;
                    let logger = cls.logger;

                    nit.log (logger.prefix + logger.formatMessage (host, message, ...args) + logger.stack);

                    return host;
                })
                .lifecycleMethod ("logLevelPrefix", null, function (level)
                {
                    return `[${level.toUpperCase ()}] ` + (level == "debug" ? `(${this.constructor.name}) ` : "");
                })
                .lifecycleMethod ("logLevelColor", null, function (level)
                {
                    let cls = this.constructor;
                    let color = cls.logger.levelColors[level];

                    if (!color)
                    {
                        let fgColors = Self.Colorizer.FG_COLORS;
                        let index = Math.abs (Self.String.intHash (cls.name)) % fgColors.length;

                        return fgColors[index];
                    }

                    return color;
                })
                .do (function ()
                {
                    nit.log.LEVELS.forEach (level =>
                    {
                        this.method (level, function (message, ...args)
                        {
                            let host = this;
                            let cls = host.constructor;
                            let logger = cls.logger;

                            if (level == "debug" && !nit.debug.allows (cls.name))
                            {
                                return host;
                            }

                            message = logger.formatMessage (host, message, ...args);

                            if (~message.indexOf ("\n"))
                            {
                                message = nit.indent (message).trim ();
                            }
                            else
                            {
                                message = message.trim ();
                            }

                            let color = host.logLevelColor (level);
                            let loggerPrefix = logger.prefix;
                            let levelPrefix = host.logLevelPrefix (level);
                            let prefix = loggerPrefix + levelPrefix;

                            if (!loggerPrefix && color)
                            {
                                prefix = Self.Colorizer[color] (prefix);
                            }

                            nit.log (prefix + message + logger.stack);

                            return host;
                        });
                    });
                })
            ;
        })
        .staticMethod ("onUsePlugin", function (hostClass, plugin)
        {
            hostClass.mixin (Self.Mixin, ["outerClass"]);
            hostClass.constant (Self.kLogger, plugin);
        })
    ;
};

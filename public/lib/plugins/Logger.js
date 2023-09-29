module.exports = function (nit)
{
    return nit.definePlugin ("Logger")
        .use ("nit.utils.String")
        .staticProperty ("timestamp", "boolean?") // prepend timestamp

        .field ("openTag", "string", "The template's open tag.", "%{")
        .field ("closeTag", "string", "The template's close tag.", "}")
        .field ("stackTrace", "boolean", "Whether to the stack trace")
        .field ("timestamp", "boolean?", "Whether to show the timestamp")
        .field ("transforms", "object", "The transforms.", { defval: { nit: nit } })

        .memo ("timestampEnabled", function ()
        {
            var self = this;

            return nit.is.bool (self.timestamp)
                ? self.timestamp
                : (nit.is.bool (self.constructor.timestamp) ? self.constructor.timestamp : false)
            ;
        })
        .getter ("prefix", function ()
        {
            return this.timestampEnabled ? (nit.timestamp ().replace ("T", " ") + " ") : "";
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
        .method ("formatMessage", function (host, message, args)
        {
            var cls = host.constructor;

            if (typeof message == "string")
            {
                message = cls.t (message);

                var p = nit.format.parse ([message].concat (args));

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
        .staticMethod ("onUsePlugin", function (hostClass, plugin)
        {
            hostClass
                .staticLifecycleMethod ("logLevelPrefix", null, function (level, host) // eslint-disable-line no-unused-vars
                {
                    return "[" + level.toUpperCase () + "] " + (level == "debug" ? "(" + this.name + ") " : "");
                })
                .staticLifecycleMethod ("logPrefix", null, function (level, host)
                {
                    return plugin.prefix + this.logLevelPrefix (level, host);
                })
                .method ("writeLog", function (message)
                {
                    nit.log (message);

                    return this;
                })
                .method ("log", function (message)
                {
                    return this.writeLog (plugin.prefix + plugin.formatMessage (this, message, nit.array (arguments).slice (1)) + plugin.stack);
                })
                .do (function ()
                {
                    nit.log.LEVELS.forEach (function (level)
                    {
                        hostClass.method (level, function (message)
                        {
                            var self = this;
                            var cls = self.constructor;

                            if (level == "debug" && !nit.debug.allows (cls.name))
                            {
                                return self;
                            }

                            message = plugin.formatMessage (self, message, nit.array (arguments).slice (1));

                            if (~message.indexOf ("\n"))
                            {
                                message = nit.indent (message).trim ();
                            }
                            else
                            {
                                message = message.trim ();
                            }

                            return self.writeLog (cls.logPrefix (level, self) + message + plugin.stack);
                        });
                    });
                })
            ;
        })
    ;
};

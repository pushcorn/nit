module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("Logger"))
        .field ("[global]", "boolean", "Whether to handle the logging globally.")
        .field ("openTag", "string?", "The template's open tag.")
        .field ("closeTag", "string?", "The template's close tag.")
        .field ("stackTrace", "boolean?", "Whether to append the stack trace.")
        .field ("timestamp", "boolean?", "Whether to show the timestamp.")
        .defineInnerClass ("Logger", function (Logger)
        {
            Logger
                .defineMeta ("openTag", "string", "%{")
                .defineMeta ("closeTag", "string", "}")
                .defineMeta ("stackTrace", "boolean?")
                .defineMeta ("timestamp", "boolean?")
                .defineInnerClass ("Transforms")
                .staticMethod ("transform", function (name, transform)
                {
                    nit.dpv (this.Transforms, name, transform, true, true);

                    return this;
                })
                .staticMethod ("handleGlobalLogging", function (hostClass)
                {
                    nit.log.logger = function ()
                    {
                        nit.invoke ([hostClass.logger, "log"], [hostClass, "LOG"].concat (nit.array (arguments)));
                    };

                    nit.log.LEVELS.forEach (function (level)
                    {
                        nit.log[level] = nit.log[level[0]] = function ()
                        {
                            nit.invoke ([hostClass.logger, level], [hostClass].concat (nit.array (arguments)));
                        };
                    });
                })
                .transform ("nit", nit)
                .onDefineSubclass (function (Subclass)
                {
                    Subclass.defineInnerClass ("Transforms", this.Transforms.name);
                })
                .lifecycleMethod ("formatStack", function (host, message)
                {
                    var self = this;
                    var cls = self.constructor;
                    var suffix = cls.stackTrace ? "\n" + new Error ().stack.split ("\n").slice (4).join ("\n") : "";

                    suffix = nit.invoke ([self, cls[cls.kFormatStack]], nit.array (arguments).concat (suffix), suffix);

                    return message + suffix;
                })
                .lifecycleMethod ("formatPrefix", function (host, message)
                {
                    var self = this;
                    var cls = self.constructor;
                    var prefix = cls.timestamp ? (nit.timestamp ().replace ("T", " ") + " ") : "";

                    prefix = nit.invoke ([self, cls[cls.kFormatPrefix]], nit.array (arguments).concat (prefix), prefix);

                    return prefix + message;
                })
                .lifecycleMethod ("formatLevel", function (host, level, message)
                {
                    var self = this;
                    var cls = self.constructor;
                    var prefix = "[" + level.toUpperCase () + "] " + (level == "debug" ? "(" + nit.getClass (host).name + ") " : "");

                    prefix = nit.invoke ([self, cls[cls.kFormatLevel]], nit.array (arguments).concat (prefix), prefix);

                    return prefix + message;
                })
                .method ("formatMessage", function (host, message, args)
                {
                    var self = this;
                    var cls = self.constructor;

                    if (typeof message == "string")
                    {
                        var hostClass = nit.getClass (host);

                        message = hostClass.t (message);

                        var p = nit.format.parse ([message].concat (args));
                        var config = { openTag: cls.openTag, closeTag: cls.closeTag, transforms: hostClass.Logger.Transforms };

                        message = nit.Template.render (message, p.data, config);
                    }
                    else
                    if (message instanceof Error)
                    {
                        message = message.stack;
                    }
                    else
                    {
                        message = JSON.stringify (message);
                    }

                    message = nit.trim (message);

                    if (~message.indexOf ("\n"))
                    {
                        message = nit.indent (message).trim ();
                    }

                    return message;
                })
                .method ("writeLog", function (message)
                {
                    nit.log (message);

                    return this;
                })
                .method ("log", function (host, level, message)
                {
                    var self = this;
                    var cls = host.constructor;

                    if (level == "debug" && !nit.debug.allows (cls.name))
                    {
                        return self;
                    }

                    message = self.formatMessage (host, message, nit.array (arguments).slice (3));
                    message = self.formatLevel (host, level, message);
                    message = self.formatPrefix (host, message);
                    message = self.formatStack (host, message);

                    return self.writeLog (message);
                })
                .do (function ()
                {
                    nit.log.LEVELS.forEach (function (level)
                    {
                        Logger.method (level, function (host, message) // eslint-disable-line no-unused-vars
                        {
                            var self = this;

                            self.log.apply (self, [host, level].concat (nit.array (arguments).slice (1)));
                        });
                    });
                })
            ;
        })
        .onUsedBy (function (hostClass)
        {
            var plugin = this;

            hostClass
                .staticMethod ("defineLogger", function (builder)
                {
                    return this.defineInnerClass ("Logger", Self.Logger.name, builder);
                })
                .defineLogger (function (Logger)
                {
                    nit.each (plugin.toPojo (), function (v, k)
                    {
                        Logger.meta (k, v);
                    });

                    if (plugin.global)
                    {
                        Logger.handleGlobalLogging (hostClass);
                    }
                })
                .staticProperty ("logger", Self.Logger.name, function (prop, owner)
                {
                    return new owner.Logger;
                })
                .do (function ()
                {
                    nit.log.LEVELS.forEach (function (level)
                    {
                        hostClass.method (level, function (message) // eslint-disable-line no-unused-vars
                        {
                            var host = this;
                            var logger = host.constructor.logger;

                            logger[level].apply (logger, [host].concat (nit.array (arguments)));
                        });
                    });
                })
            ;
        })
    ;
};

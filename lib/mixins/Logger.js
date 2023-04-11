module.exports = function (nit)
{
    return nit.defineClass ("mixins.Logger")
        .defineInnerClass ("LoggerOptions", LoggerOptions =>
        {
            LoggerOptions
                .field ("openTag", "string", "The template's open tag.", "%{")
                .field ("closeTag", "string", "The template's close tag.", "}")
                .field ("transforms", "object", "The transforms.", { defval: { nit } })
                .field ("timestamp", "boolean", "Prepend the timestamp.", true)

                .method ("registerTransform", function (name, func)
                {
                    this.transforms[name] = func;

                    return this;
                })
                .getter ("prefix", function ()
                {
                    return this.timestamp ? (nit.timestamp () + " ") : "";
                })
            ;
        })
        .staticProperty ("loggerOptions", "mixins.Logger.LoggerOptions", function (p, cls)
        {
            return new cls.LoggerOptions;
        })
        .staticMethod ("formatMessage", function (message, ...args) // eslint-disable-line no-unused-vars
        {
            if (typeof message == "string")
            {
                message = this.t (message);

                let p = nit.format.parse (arguments);

                return nit.Template.render (message, p.data, this.loggerOptions);
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
        .method ("log", function (message, ...args)
        {
            let cls = this.constructor;

            nit.log (cls.loggerOptions.prefix + cls.formatMessage (message, ...args));

            return this;
        })
        .do (function ()
        {
            nit.log.LEVELS.forEach (level =>
            {
                let ucLevel = level.toUpperCase ();

                this.method (level, function (message, ...args)
                {
                    return this.log ("[" + ucLevel + "] " + this.constructor.formatMessage (message, ...args));
                });
            });
        })
    ;
};

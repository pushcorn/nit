module.exports = function (nit, Self)
{
    return (Self = nit.requireAsset ("public/lib/plugins/Logger"))
        .use ("nit.utils.Colorizer")
        .field ("colorize", "boolean?", "Whether to colorize the log level.")
        .field ("levelColors", "object", "The prefix colors by log levels.",
        {
            defval:
            {
                info: "green",
                warn: "yellow",
                error: "red"
            }
        })
        .memo ("colorEnabled", function ()
        {
            return nit.is.bool (this.colorize)
                ? this.colorize
                : process.stdout.isTTY && nit.ENV.TERM != "dumb"
            ;
        })
        .do ("onUsePlugin", onUsePlugin =>
        {
            Self.staticMethod ("onUsePlugin", function (hostClass, plugin)
            {
                onUsePlugin.call (this, hostClass, plugin);

                hostClass
                    .staticLifecycleMethod ("logLevelColor", null, function (level, host) // eslint-disable-line no-unused-vars
                    {
                        let cls = this;
                        let color = plugin.levelColors[level];

                        if (!color)
                        {
                            let fgColors = Self.Colorizer.FG_COLORS;
                            let index = Math.abs (Self.String.intHash (cls.name + ":" + level)) % fgColors.length;

                            return fgColors[index];
                        }

                        return color;
                    })
                    .staticLifecycleMethod ("logPrefix", null, function (level, host)
                    {
                        let cls = this;
                        let color = cls.logLevelColor (level, host);
                        let loggerPrefix = plugin.prefix;
                        let levelPrefix = cls.logLevelPrefix (level, host);
                        let prefix = loggerPrefix + levelPrefix;

                        if (plugin.colorEnabled && !loggerPrefix && color)
                        {
                            prefix = Self.Colorizer[color] (prefix);
                        }

                        return prefix;
                    })
                ;
            });
        })
    ;
};

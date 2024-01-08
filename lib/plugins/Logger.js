module.exports = function (nit, Self)
{
    return (Self = nit.requireAsset ("public/lib/plugins/Logger"))
        .use ("nit.utils.Colorizer")
        .use ("nit.utils.String")
        .do ("Logger", Logger =>
        {
            Logger
                .defineMeta ("colorize", "boolean?") // Whether to colorize the log level.
                .defineMeta ("colorMap", "object", // The colors for log levels.
                {
                    defval:
                    {
                        info: "green",
                        warn: "yellow",
                        error: "red"
                    }
                })
                .staticMemo ("colorEnabled", function ()
                {
                    return nit.is.bool (this.colorize)
                        ? this.colorize
                        : process.stdout.isTTY && nit.ENV.TERM != "dumb"
                    ;
                })
                .lifecycleMethod ("colorForLevel", null, function (host, level) // eslint-disable-line no-unused-vars
                {
                    let self = this;
                    let cls = self.constructor;
                    let color = cls.colorMap[level];

                    if (!color)
                    {
                        let fgColors = Self.Colorizer.FG_COLORS;
                        let index = Math.abs (Self.String.intHash (host.constructor.name + ":" + level)) % fgColors.length;

                        return fgColors[index];
                    }

                    return color;
                })
                .lifecycleMethod ("formatPrefix", function (host, message)
                {
                    var self = this;
                    var cls = self.constructor;
                    var prefix = cls.timestamp ? (nit.timestamp ().replace ("T", " ") + " ") : "";

                    prefix = nit.invoke ([self, cls[cls.kFormatPrefix]], nit.array (arguments).concat (prefix), prefix);

                    if (cls.colorEnabled)
                    {
                        prefix = Self.Colorizer.bold (prefix);
                    }

                    return prefix + message;
                })
                .lifecycleMethod ("formatLevel", function (host, level, message)
                {
                    var self = this;
                    var cls = self.constructor;
                    var prefix = "[" + level.toUpperCase () + "] " + ((level == "debug" || level == "error") ? "(" + host.constructor.name + ") " : "");

                    prefix = nit.invoke ([self, cls[cls.kFormatLevel]], nit.array (arguments).concat (prefix), prefix);

                    if (cls.colorEnabled)
                    {
                        let color = self.colorForLevel (host, level);

                        prefix = Self.Colorizer.bold (Self.Colorizer[color] (prefix));
                    }

                    return prefix + message;
                })
            ;
        })
    ;
};

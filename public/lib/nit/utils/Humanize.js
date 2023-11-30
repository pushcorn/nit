module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.utils.Humanize"))
        .m ("error.invalid_duration_unit", "The duration unit '%{unit}' is invalid. (Input: %{input})")
        .constant ("DURATIONS",
        {
            year: 365 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            hour: 60 * 60 * 1000,
            minute: 60 * 1000,
            second: 1000,
            millisecond: 1
        })
        .constant ("DURAION_ALIASES",
        {
            year: "y",
            month: ["m", "mon"],
            week: "w",
            day: "d",
            hour: "h",
            minute: ["min"],
            second: ["s", "sec"],
            millisecond: ["ms", "msec"]
        })
        .constant ("SI_BYTE_UNITS", "B KB MB GB TB PB EB ZB YB".split (" "))
        .constant ("IEC_BYTE_UNITS", "B KiB MiB GiB TiB PiB EiB ZiB YiB".split (" "))
        .staticMemo ("durationAliasMap", function ()
        {
            var map = {};

            nit.each (Self.DURATIONS, function (v, k)
            {
                map[k] = v;
                map[nit.pluralize (k)] = v;

                nit.each (Self.DURAION_ALIASES, function (aliases, k)
                {
                    nit.each (aliases, function (a)
                    {
                        map[a] = map[k];
                    });
                });
            });

            return map;
        })

        .staticMethod ("parseDuration", function (str)
        {
            var ap = Self.durationAliasMap;
            var duration = 0;

            nit.trim (str).replace (/(\d+)\s*([a-z]+)/ig, function (match, v, unit)
            {
                if (!(unit in ap))
                {
                    Self.throw ("error.invalid_duration_unit", { unit: unit, input: str });
                }

                duration += v * ap[unit];
            });

            return duration;
        })
        .staticMethod ("duration", function (ms, returnObject, roundTo)
        {
            var opts = nit.typedArgsToObj (arguments,
            {
                ms: "integer",
                returnObject: "boolean",
                roundTo: "string|integer"
            });

            var negative = ms < 0;
            var DURATIONS = Self.DURATIONS;
            var results = {};

            ms = Math.abs (ms);
            roundTo = opts.roundTo;

            if (ms == 0)
            {
                results.millisecond = 0;
            }
            else
            {
                for (var unit in DURATIONS)
                {
                    var dur = DURATIONS[unit];
                    var cnt = ~~(ms / dur);

                    if (cnt > 0)
                    {
                        results[unit] = cnt;
                        ms -= cnt * dur;
                    }
                }
            }

            if (!nit.is.undef (roundTo))
            {
                if (nit.is.int (roundTo))
                {
                    var keys = nit.keys (results);

                    roundTo = Math.min (Math.max (roundTo, 1), keys.length);
                    roundTo = keys.slice (roundTo - 1, roundTo).pop ();
                }

                var baseFound = false;

                if (!(roundTo in results))
                {
                    results[roundTo] = 0;
                }

                for (var u in DURATIONS)
                {
                    if (!(u in results))
                    {
                        continue;
                    }

                    var c = results[u];

                    if (baseFound)
                    {
                        results[roundTo] += c * DURATIONS[u] / DURATIONS[roundTo];

                        delete results[u];
                    }
                    else
                    if (u == roundTo)
                    {
                        baseFound = true;
                    }
                }

                results[roundTo] = Math.round (results[roundTo] * 100) / 100;
            }

            if (opts.returnObject)
            {
                return nit.assign ({ negative: negative }, results);
            }
            else
            {
                results = nit.each (results, function (cnt, unit)
                {
                    return cnt + " " + nit.pluralize (unit, cnt);

                });

                return (negative ? "-" : "") + (results.length > 1
                    ? results.slice (0, -1).join (", ") + " and " + results.pop ()
                    : results.join (", "))
                ;
            }
        })
        .staticMethod ("bytes", function (bytes, si, dp)
        {
            var opts = nit.typedArgsToObj (arguments,
            {
                bytes: "integer",
                si: "boolean",
                dp: "integer"
            });

            bytes = Math.abs (bytes);
            si = nit.coalesce (opts.si, true);
            dp = Math.max (0, nit.coalesce (opts.dp, 1));

            var step = si ? 1000 : 1024;
            var units = (si ? Self.SI_BYTE_UNITS : Self.IEC_BYTE_UNITS).slice ();
            var r = Math.pow (10, dp);

            while (bytes >= step && units.length > 1)
            {
                bytes /= step;
                units.shift ();
            }

            return (Math.round (bytes * r) / r) + " " + units[0];
        })
    ;
};

module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.utils.Humanize"))
        .m ("error.negative_duration", "The duration value (%{duration}) cannot be negative.")
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
        .constant ("SI_BYTE_UNITS", "B KB MB GB TB PB EB ZB YB".split (" "))
        .constant ("IEC_BYTE_UNITS", "B KiB MiB GiB TiB PiB EiB ZiB YiB".split (" "))

        .staticMethod ("duration", function (ms, returnObject, roundTo)
        {
            var opts = nit.typedArgsToObj (arguments,
            {
                ms: "integer",
                returnObject: "boolean",
                roundTo: ["string", "integer"]
            });

            if (ms < 0)
            {
                this.throw ("error.negative_duration", { duration: ms });
            }

            var DURATIONS = Self.DURATIONS;
            var results = {};

            ms = opts.ms;
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
                return results;
            }
            else
            {
                results = nit.each (results, function (cnt, unit)
                {
                    return cnt + " " + nit.pluralize (unit, cnt);

                });

                return results.length > 1
                    ? results.slice (0, -1).join (", ") + " and " + results.pop ()
                    : results.join (", ")
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

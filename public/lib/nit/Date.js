module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Date"))
        .constant ("DATE_TIME_FORMAT_OPTIONS", { fractionalSecondDigits: 3 })
        .constant ("DAY_NAMES", "Sun|Mon|Tue|Wed|Thu|Fri|Sat".split ("|"))
        .field ("[date]", "any", "The date to be parsed.", function () { return new Date; })
            .constraint ("type", "integer", "string", "Date", "nit.Date")
            .constraint ("custom",
            {
                code: "error.invalid_date",
                message: "The date '%{value}' is invalid.",
                condition: "nit.is.str (date)",
                validator: function (ctx)
                {
                    return nit.parseDate (ctx.value);
                }
            })
        .field ("[timezone]", "string", "The timezone in which the date is observed.", nit.timezone ())
            .constraint ("choice", { choices: Intl.supportedValuesOf ("timeZone") })

        .onConstruct (function (date, timezone)
        {
            if (date instanceof nit.Date)
            {
                this.date = date.date;
                this.timezone = date.timezone;
            }
            else
            {
                if (nit.is.int (date))
                {
                    date = new Date (date);
                }

                this.date = nit.parseDate (date, timezone);
            }
        })
        .method ("toTimestamp", function (keepOffset)
        {
            return nit.timestamp (this.date, this.timezone, nit.is.bool (keepOffset) ? keepOffset : true, Self.DATE_TIME_FORMAT_OPTIONS);
        })
        .method ("getComponents", function ()
        {
            return nit.parseDate.match (this.toTimestamp ());
        })
        .method ("getComponent", function (component)
        {
            return this.getComponents ()[component];
        })
        .method ("setComponent", function (component, value)
        {
            var self = this;
            var c = self.getComponents ();

            if (c[component] !== value)
            {
                c[component] = value;

                var d = new Date (Date.UTC (c.year, c.month, c.day, c.hour, c.minute, c.second, c.millisecond));

                self.date = nit.parseDate (d.toISOString (), self.timezone);
            }

            return self.date * 1;
        })
        .method ("getDate", function ()
        {
            return this.getComponent ("day");
        })
        .method ("getDay", function ()
        {
            var day = Intl.DateTimeFormat ("en-US", { timeZone: this.timezone, weekday: "short" }).format (this.date);

            return Self.DAY_NAMES.indexOf (day);
        })
        .method ("getFullYear", function ()
        {
            return this.getComponent ("year");
        })
        .method ("getHours", function ()
        {
            return this.getComponent ("hour");
        })
        .method ("getMilliseconds", function ()
        {
            return this.getComponent ("millisecond");
        })
        .method ("getMinutes", function ()
        {
            return this.getComponent ("minute");
        })
        .method ("getMonth", function ()
        {
            return this.getComponent ("month");
        })
        .method ("getSeconds", function ()
        {
            return this.getComponent ("second");
        })
        .method ("getTime", function ()
        {
            return this.date.getTime ();
        })
        .method ("getTimezoneOffset", function ()
        {
            var c = this.getComponents ();

            return -c.offHour * 60 - c.offMin;
        })
        .method ("getUTCDate", function ()
        {
            return this.date.getUTCDate ();
        })
        .method ("getUTCDay", function ()
        {
            return this.date.getUTCDay ();
        })
        .method ("getUTCFullYear", function ()
        {
            return this.date.getUTCFullYear ();
        })
        .method ("getUTCHours", function ()
        {
            return this.date.getUTCHours ();
        })
        .method ("getUTCMilliseconds", function ()
        {
            return this.date.getUTCMilliseconds ();
        })
        .method ("getUTCMinutes", function ()
        {
            return this.date.getUTCMinutes ();
        })
        .method ("getUTCMonth", function ()
        {
            return this.date.getUTCMonth ();
        })
        .method ("getUTCSeconds", function ()
        {
            return this.date.getUTCSeconds ();
        })
        .method ("setDate", function (date)
        {
            return this.setComponent ("day", date);
        })
        .method ("setFullYear", function (year)
        {
            return this.setComponent ("year", year);
        })
        .method ("setHours", function (hours)
        {
            return this.setComponent ("hour", hours);
        })
        .method ("setMilliseconds", function (milliseconds)
        {
            return this.setComponent ("millisecond", milliseconds);
        })
        .method ("setMinutes", function (minutes)
        {
            return this.setComponent ("minute", minutes);
        })
        .method ("setMonth", function (month)
        {
            return this.setComponent ("month", month);
        })
        .method ("setSeconds", function (seconds)
        {
            return this.setComponent ("second", seconds);
        })
        .method ("setTime", function (time)
        {
            return this.date.setTime (time);
        })
        .method ("setUTCDate", function (date)
        {
            return this.date.setUTCDate (date);
        })
        .method ("setUTCFullYear", function (year)
        {
            return this.date.setUTCFullYear (year);
        })
        .method ("setUTCHours", function (hours)
        {
            return this.date.setUTCHours (hours);
        })
        .method ("setUTCMilliseconds", function (milliseconds)
        {
            return this.date.setUTCMilliseconds (milliseconds);
        })
        .method ("setUTCMinutes", function (minutes)
        {
            return this.date.setUTCMinutes (minutes);
        })
        .method ("setUTCMonth", function (month)
        {
            return this.date.setUTCMonth (month);
        })
        .method ("setUTCSeconds", function (seconds)
        {
            return this.date.setUTCSeconds (seconds);
        })
        .method ("toDateString", function ()
        {
            var ts = this.toTimestamp (false);

            return nit.parseDate (ts).toDateString ();
        })
        .method ("toGMTString", function ()
        {
            return this.date.toGMTString ();
        })
        .method ("toISOString", function ()
        {
            return this.date.toISOString ();
        })
        .method ("toJSON", function ()
        {
            return this.date.toJSON ();
        })
        .method ("toLocaleDateString", function (locales, options)
        {
            var ts = this.toTimestamp (false);

            return nit.parseDate (ts).toLocaleDateString (locales, options);
        })
        .method ("toLocaleTimeString", function (locales, options)
        {
            var ts = this.toTimestamp (false);

            return nit.parseDate (ts).toLocaleTimeString (locales, options);
        })
        .method ("toTimeString", function ()
        {
            var self = this;
            var date = self.date;
            var tz = self.timezone;
            var ts = self.toTimestamp (false);
            var name = Intl.DateTimeFormat ("en-US", { day: "2-digit", timeZone: tz, timeZoneName: "long" }).format (date);
            var offset = Intl.DateTimeFormat ("en-US", { day: "2-digit", timeZone: tz, timeZoneName: "longOffset" }).format (date);

            return nit.parseDate (ts).toTimeString ().slice (0, 9)
                + offset.slice (4).replace (":", "")
                + " (" + name.slice (4) + ")";
        })
        .method ("toUTCString", function ()
        {
            return this.date.toUTCString ();
        })
        .method ("valueOf", function ()
        {
            return this.date.valueOf ();
        })
        .method ("toString", function ()
        {
            var self = this;
            var tz = self.timezone;
            var date = self.date;
            var name = Intl.DateTimeFormat ("en-US", { day: "2-digit", timeZone: tz, timeZoneName: "long" }).format (date);
            var offset = Intl.DateTimeFormat ("en-US", { day: "2-digit", timeZone: tz, timeZoneName: "longOffset" }).format (date);
            var dateTime = Intl.DateTimeFormat ("en-US",
                {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    hour12: false,
                    minute: "2-digit",
                    second: "2-digit",
                    weekday: "short",
                    timeZone: tz
                })
                .format (self.date)
                .replace (/,/g, "")
            ;

            return dateTime
                + " " + offset.slice (4).replace (":", "")
                + " (" + name.slice (4) + ")";
        })
        .symbolMethod ("toPrimitive", function (hint)
        {
            return hint == "number" ? this.valueOf () : this.toString ();
        })
    ;
};

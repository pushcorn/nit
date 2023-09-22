module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Date"))
        .constant ("DATE_TIME_FORMAT_OPTIONS", { fractionalSecondDigits: 3 })
        .constant ("DAY_NAMES", "Sun|Mon|Tue|Wed|Thu|Fri|Sat".split ("|"))
        .constant ("TIMEZONES", Intl.supportedValuesOf ("timeZone").concat (
        [
            "Africa/Asmara",
            "Africa/Timbuktu",
            "America/Argentina/Buenos_Aires",
            "America/Argentina/Catamarca",
            "America/Argentina/ComodRivadavia",
            "America/Argentina/Cordoba",
            "America/Argentina/Jujuy",
            "America/Argentina/Mendoza",
            "America/Atikokan",
            "America/Atka",
            "America/Ensenada",
            "America/Fort_Wayne",
            "America/Indiana/Indianapolis",
            "America/Kentucky/Louisville",
            "America/Knox_IN",
            "America/Montreal",
            "America/Nuuk",
            "America/Porto_Acre",
            "America/Rosario",
            "America/Shiprock",
            "America/Virgin",
            "Antarctica/South_Pole",
            "Asia/Ashkhabad",
            "Asia/Chongqing",
            "Asia/Chungking",
            "Asia/Dacca",
            "Asia/Harbin",
            "Asia/Ho_Chi_Minh",
            "Asia/Istanbul",
            "Asia/Kashgar",
            "Asia/Kathmandu",
            "Asia/Kolkata",
            "Asia/Macao",
            "Asia/Tel_Aviv",
            "Asia/Thimbu",
            "Asia/Ujung_Pandang",
            "Asia/Ulan_Bator",
            "Asia/Yangon",
            "Atlantic/Faroe",
            "Atlantic/Jan_Mayen",
            "Australia/ACT",
            "Australia/Canberra",
            "Australia/LHI",
            "Australia/NSW",
            "Australia/North",
            "Australia/Queensland",
            "Australia/South",
            "Australia/Tasmania",
            "Australia/Victoria",
            "Australia/West",
            "Australia/Yancowinna",
            "Brazil/Acre",
            "Brazil/DeNoronha",
            "Brazil/East",
            "Brazil/West",
            "CET",
            "CST6CDT",
            "Canada/Atlantic",
            "Canada/Central",
            "Canada/Eastern",
            "Canada/Mountain",
            "Canada/Newfoundland",
            "Canada/Pacific",
            "Canada/Saskatchewan",
            "Canada/Yukon",
            "Chile/Continental",
            "Chile/EasterIsland",
            "Cuba",
            "EET",
            "EST",
            "EST5EDT",
            "Egypt",
            "Eire",
            "Etc/GMT",
            "Etc/GMT+0",
            "Etc/GMT+1",
            "Etc/GMT+10",
            "Etc/GMT+11",
            "Etc/GMT+12",
            "Etc/GMT+2",
            "Etc/GMT+3",
            "Etc/GMT+4",
            "Etc/GMT+5",
            "Etc/GMT+6",
            "Etc/GMT+7",
            "Etc/GMT+8",
            "Etc/GMT+9",
            "Etc/GMT-0",
            "Etc/GMT-1",
            "Etc/GMT-10",
            "Etc/GMT-11",
            "Etc/GMT-12",
            "Etc/GMT-13",
            "Etc/GMT-14",
            "Etc/GMT-2",
            "Etc/GMT-3",
            "Etc/GMT-4",
            "Etc/GMT-5",
            "Etc/GMT-6",
            "Etc/GMT-7",
            "Etc/GMT-8",
            "Etc/GMT-9",
            "Etc/GMT0",
            "Etc/Greenwich",
            "Etc/UCT",
            "Etc/UTC",
            "Etc/Universal",
            "Etc/Zulu",
            "Europe/Belfast",
            "Europe/Kyiv",
            "Europe/Nicosia",
            "Europe/Tiraspol",
            "Factory",
            "GB",
            "GB-Eire",
            "GMT",
            "GMT+0",
            "GMT-0",
            "GMT0",
            "Greenwich",
            "HST",
            "Hongkong",
            "Iceland",
            "Iran",
            "Israel",
            "Jamaica",
            "Japan",
            "Kwajalein",
            "Libya",
            "MET",
            "MST",
            "MST7MDT",
            "Mexico/BajaNorte",
            "Mexico/BajaSur",
            "Mexico/General",
            "NZ",
            "NZ-CHAT",
            "Navajo",
            "PRC",
            "PST8PDT",
            "Pacific/Chuuk",
            "Pacific/Kanton",
            "Pacific/Pohnpei",
            "Pacific/Samoa",
            "Pacific/Yap",
            "Poland",
            "Portugal",
            "ROC",
            "ROK",
            "Singapore",
            "Turkey",
            "UCT",
            "US/Alaska",
            "US/Aleutian",
            "US/Arizona",
            "US/Central",
            "US/East-Indiana",
            "US/Eastern",
            "US/Hawaii",
            "US/Indiana-Starke",
            "US/Michigan",
            "US/Mountain",
            "US/Pacific",
            "US/Samoa",
            "UTC",
            "Universal",
            "W-SU",
            "WET",
            "Zulu"
        ]).sort ())
        .defineInnerClass ("Timezone", function (Timezone)
        {
            Timezone
                .field ("<name>", "string", "The timezone name.")
                    .constraint ("choice", { choices: Self.TIMEZONES })
            ;
        })
        .field ("[date]", "any", "The date to be parsed.", function () { return new Date; })
            .constraint ("type", "integer", "string", "Date", "nit.Date")
            .constraint ("custom",
            {
                code: "error.invalid_date",
                message: "The date '%{value}' is invalid.",
                condition: "nit.is.str (value)",
                validator: function (ctx)
                {
                    return nit.parseDate (ctx.value);
                }
            })
        .field ("[timezone]", Self.Timezone.name, "The timezone in which the date is observed.", new Self.Timezone (nit.timezone ()))

        .getter ("timezoneName", function ()
        {
            var tz = this.timezone;

            return tz && tz.name;
        })
        .onConstruct (function (date)
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

                this.date = nit.parseDate (date, this.timezoneName);
            }
        })
        .method ("toTimestamp", function (keepOffset)
        {
            return nit.timestamp (this.date, this.timezoneName, nit.is.bool (keepOffset) ? keepOffset : true, Self.DATE_TIME_FORMAT_OPTIONS);
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

                self.date = nit.parseDate (d.toISOString (), self.timezoneName);
            }

            return self.date * 1;
        })
        .method ("getDate", function ()
        {
            return this.getComponent ("day");
        })
        .method ("getDay", function ()
        {
            var day = Intl.DateTimeFormat ("en-US", { timeZone: this.timezoneName, weekday: "short" }).format (this.date);

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
            var tz = self.timezoneName;
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
            var tz = self.timezoneName;
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

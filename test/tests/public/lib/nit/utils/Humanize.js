const Humanize = nit.require ("nit.utils.Humanize");


test.method ("nit.utils.Humanize", "duration", true)
    .should ("return '%{result}' when duration is %{args.0}")
        .given (1000)
        .returns ("1 second")
        .commit ()

    .given (2378)
        .returns ("2 seconds and 378 milliseconds")
        .commit ()

    .given (3 * Humanize.DURATIONS.day + 5 * Humanize.DURATIONS.hour + 24 * Humanize.DURATIONS.minute)
        .returns ("3 days, 5 hours and 24 minutes")
        .commit ()

    .given (3 * Humanize.DURATIONS.day + 5 * Humanize.DURATIONS.hour + 11 * Humanize.DURATIONS.minute, "hour")
        .returns ("3 days and 5.18 hours")
        .commit ()

    .given (3 * Humanize.DURATIONS.day + 5 * Humanize.DURATIONS.hour + 11 * Humanize.DURATIONS.minute, "year")
        .returns ("0.01 years")
        .commit ()

    .given (3 * Humanize.DURATIONS.day + 5 * Humanize.DURATIONS.hour + 24 * Humanize.DURATIONS.minute, 2)
        .returns ("3 days and 5.4 hours")
        .commit ()

    .given (3 * Humanize.DURATIONS.month + 5 * Humanize.DURATIONS.day + 24 * Humanize.DURATIONS.minute, 2)
        .returns ("3 months and 5.02 days")
        .commit ()

    .given (3 * Humanize.DURATIONS.day + 5 * Humanize.DURATIONS.hour + 24 * Humanize.DURATIONS.minute, 1)
        .returns ("3.23 days")
        .commit ()

    .given (3 * Humanize.DURATIONS.day + 5 * Humanize.DURATIONS.hour + 24 * Humanize.DURATIONS.minute, 0)
        .returns ("3.23 days")
        .commit ()

    .given (3 * Humanize.DURATIONS.day + 5 * Humanize.DURATIONS.hour + 24 * Humanize.DURATIONS.minute, -1)
        .returns ("3.23 days")
        .commit ()

    .given (3 * Humanize.DURATIONS.day + 5 * Humanize.DURATIONS.hour + 24 * Humanize.DURATIONS.minute, true)
        .returns ({ day: 3, hour: 5, minute: 24, negative: false })
        .commit ()

    .given (0)
        .returns ("0 milliseconds")
        .commit ()

    .given (0, "year")
        .returns ("0 years")
        .commit ()

    .given (-300)
        .returns ("-300 milliseconds")
        .commit ()
;


test.method ("nit.utils.Humanize", "bytes", true)
    .should ("return '%{result}' when duration is %{args.0}")
        .given (0)
        .returns ("0 B")
        .commit ()

    .given (1)
        .returns ("1 B")
        .commit ()

    .given (1224)
        .returns ("1.2 KB")
        .commit ()

    .given (1024, 3)
        .returns ("1.024 KB")
        .commit ()

    .given (1024)
        .returns ("1 KB")
        .commit ()

    .given (1024, false)
        .returns ("1 KiB")
        .commit ()

    .given (Math.pow (1024, 4))
        .returns ("1.1 TB")
        .commit ()

    .given (1300, 2)
        .returns ("1.3 KB")
        .commit ()

    .given (1350, 2)
        .returns ("1.35 KB")
        .commit ()
;


test.method ("nit.utils.Humanize", "parseDuration", true)
    .should ("parse %{args.0|format} to %{result} milliseconds")
        .given ("2y")
        .given ("2 y")
        .given ("2 year")
        .given ("2 years")
        .returns (2 * 365 * 24 * 60 * 60 * 1000)
        .commit ()

    .reset ()
        .given ("1d 3h 5min")
        .given ("1d3h5min")
        .returns (24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 5 * 60 * 1000)
        .commit ()

    .should ("throw if the alias is invalid")
        .given ("1d3h5mins")
        .given ("2ys")
        .given ("2 ys")
        .throws ("error.invalid_duration_unit")
        .commit ()
;

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
        .returns ({ day: 3, hour: 5, minute: 24 })
        .commit ()

    .given (0)
        .returns ("0 milliseconds")
        .commit ()

    .given (0, "year")
        .returns ("0 years")
        .commit ()

    .given (-300)
        .throws ("error.negative_duration")
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

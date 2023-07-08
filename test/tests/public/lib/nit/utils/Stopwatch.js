test.method ("nit.utils.Stopwatch", "start")
    .should ("start the timer")
    .returnsInstanceOf ("nit.utils.Stopwatch")
    .expectingPropertyToBe ("result.laps.length", 0)
    .commit ()
;


test.method ("nit.utils.Stopwatch", "lap")
    .should ("record a lap")
        .given ("message one")
        .before (async () => await nit.sleep (10))
        .mock (nit, "log")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.1", /message one/)
        .commit ()

    .given ()
        .before (async () => await nit.sleep (10))
        .mock (nit, "log")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.length", 1)
        .commit ()
;


test.method ("nit.utils.Stopwatch", "stop")
    .should ("stop the timer")
        .given ("message done")
        .before (async () => await nit.sleep (10))
        .mock (nit, "log")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.1", /message done/)
        .commit ()

    .given ()
        .before (async () => await nit.sleep (10))
        .mock (nit, "log")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.length", 1)
        .commit ()
;

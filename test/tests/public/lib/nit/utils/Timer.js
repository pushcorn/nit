test.method ("nit.utils.Timer", "set", true)
    .should ("create a timer and start it")
    .before (s => s.args = [50, function () { return 1234; }])
    .returns (1234)
    .commit ()
;


test.method ("nit.utils.Timer", "start")
    .should ("start the timer")
        .up (s => s.global = global)
        .up (s => s.Date = Date)
        .up (s => s.class = s.class.defineSubclass ("MyTimer").constant ("MAX_TIMEOUT", 30))
        .up (s => s.createArgs = [100, function (val) { return val; }, 5678])
        .mock ("Date", "now", function ()
        {
            let s = this.strategy;

            return s.now = (s.now || this.targetMethod ()) + 2;
        })
        .mock ("global", "setTimeout", function (cb, timeout)
        {
            let s = this.strategy;

            s.now += timeout;

            cb ();
        })
        .returns (5678)
        .expectingPropertyToBe ("mocks.1.invocations.length", 4)
        .expectingPropertyToBe ("object.running", false)
        .commit ()

    .should ("return the result promise if the timer is still running")
        .up (s => s.createArgs = [50, function (val) { return val; }, 1234])
        .before (s => s.object.start ())
        .before (s => s.returnsPromiseWhenRunning = s.object.start () instanceof Promise)
        .returns (1234)
        .expectingPropertyToBe ("returnsPromiseWhenRunning", true)
        .commit ()
;


test.method ("nit.utils.Timer", "stop")
    .should ("stop the timer")
    .up (s => s.createArgs = [1000, function (val) { s.cbCalled = true; return val; }, 5555])
    .before (s => { s.object.start (); })
    .before (s =>
    {
        let stop = s.object.stop;

        nit.dpv (s.object, "stop", function () { stop (); });
    })
    .returns ()
    .expectingPropertyToBe ("cbCalled", undefined)
    .commit ()
;


test.method ("nit.utils.Timer", "abort")
    .should ("abort the timer and throws the exception")
    .up (s => s.createArgs = [1000, function (val) { s.cbCalled = true; return val; }, 5555])
    .before (s => { s.object.start (); })
    .throws ("error.timer_aborted")
    .commit ()
;


test.method ("nit.utils.Timer", "cancel")
    .should ("stop the timer and run the callback")
    .up (s => s.createArgs = [1000, function (val) { s.cbCalled = true; return val; }, 5555])
    .before (s => { s.object.start (); })
    .after (s => s.object.cancel ())
    .returns (5555)
    .expectingPropertyToBe ("cbCalled", true)
    .commit ()
;


test.object ("nit.utils.Timer")
    .should ("catch the callback exception")
    .given (10, function () { throw new Error ("ERR!"); }, 5555)
    .returnsInstanceOf ("nit.utils.Timer")
    .expectingMethodToThrow ("result.start", null, /ERR!/)
    .expectingMethodToThrow ("result.abort", null, /ERR!/)
    .commit ()
;

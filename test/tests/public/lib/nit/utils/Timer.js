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
    .commit ()
;


test.method ("nit.utils.Timer", "stop")
    .should ("stop the timer")
    .up (s => s.createArgs = [1000, function (val) { s.cbCalled = true; return val; }, 5555])
    .before (s => { s.object.start (); })
    .returns ()
    .expectingPropertyToBe ("object.timeoutId", /\d+/)
    .expectingPropertyToBe ("cbCalled", undefined)
    .commit ()
;

test.method ("nit.utils.Notifier", "listen")
    .should ("start a new timer and return the notification object (a promise)")
        .up (s => s.createArgs = 100)
        .up (s => s.Timer = nit.require ("nit.utils.Timer"))
        .mock ("Timer.prototype", "start", function ()
        {
            let res = this.targetMethod.call (this.obj);

            this.strategy.startResultIsPromise = res instanceof Promise;

            return res;
        })
        .returnsInstanceOf ("nit.utils.Notifier")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("startResultIsPromise", true)
        .expectingPropertyToBeOfType ("result.timer", "nit.utils.Timer")
        .commit ()

    .should ("cancel the existing timer")
        .up (s => s.createArgs = 100)
        .before (s => { s.object.listen (); })
        .spy ("object", "notify")
        .returnsInstanceOf ("nit.utils.Notifier")
        .expectingPropertyToBe ("spies.0.invocations.length", 1)
        .commit ()
;


test.method ("nit.utils.Notifier", "stop")
    .should ("stop the notifier but not resolve the notification")
    .up (s => s.createArgs = 100)
    .before (s => { s.notification = s.object.listen (); })
    .after (s => { s.notification.then (() => s.resolved = true); })
    .returnsInstanceOf ("nit.utils.Notifier")
    .expectingPropertyToBe ("resolved", undefined)
    .commit ()
;


test.method ("nit.utils.Notifier", "notify")
    .should ("resolve the notification")
    .up (s => s.createArgs = 100)
    .before (s => { s.object.listen (); })
    .returnsInstanceOf ("nit.utils.Notifier")
    .expectingPropertyToBe ("object.timer.running", false)
    .commit ()
;

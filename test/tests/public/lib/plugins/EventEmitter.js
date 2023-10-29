test.plugin ("plugins.EventEmitter", "on")
    .should ("register an event listener")
        .up (s => s.pluginArgs = ["start", "stop"])
        .up (s => s.args = ["start", v => s.startArg = v])
        .after (({ self: s, host }) =>
        {
            host.on ("stop", v => s.stopArg = v);

            host.emit ("start", 5);
            host.emit ("stop", 7);
        })
        .expectingPropertyToBe ("startArg", 5)
        .expectingPropertyToBe ("stopArg", 7)
        .expectingMethodToThrow ("host.on", "dispatch", /not supported/)
        .commit ()
;


test.plugin ("plugins.EventEmitter", "off")
    .should ("unregister an event listener")
        .up (s => s.onStop1 = function () { s.stop1 = true; })
        .up (s => s.onStop2 = function () { s.stop2 = true; })
        .up (s => s.pluginArgs = ["start", "stop"])
        .up (s => s.args = ["stop", s.onStop1])
        .before (({ host, onStop1, onStop2 }) =>
        {
            host.on ("stop", onStop1);
            host.on ("stop", onStop2);
        })
        .after (s => s.host.emit ("stop", 7))
        .expectingPropertyToBe ("stop1", undefined)
        .expectingPropertyToBe ("stop2", true)
        .expectingMethodToThrow ("host.off", "dispatch", /not supported/)
        .expectingPropertyToBe ("host.listeners.test\\.PluginHost\\.stop.length", 1)
        .commit ()

    .should ("unregister a one-time listener")
        .up (s => s.pluginArgs = ["start"])
        .up (s => s.started = 0)
        .up (s => s.onStart = nit.assign (function () { s.started++; }, { id: 1234 }))
        .up (s => s.args = ["start", s.onStart])
        .before (s => s.host.once ("start", s.onStart))
        .after (s => s.host.emit ("start"))
        .expectingPropertyToBe ("started", 0)
        .expectingExprToReturnValue ("host.listeners.get ('start').length", 0)
        .commit ()
;


test.plugin ("plugins.EventEmitter", "emit")
    .should ("invoke the event listeners")
        .up (s => s.pluginArgs = ["stop"])
        .up (s => s.onStop1 = async function (v) { await nit.sleep (10); s.stop1 = v; })
        .given ("test.PluginHost.stop", 99)
        .before (s => s.host.on ("stop", s.onStop1))
        .expectingPropertyToBe ("stop1", 99)
        .commit ()
;


test.plugin ("plugins.EventEmitter", "once")
    .should ("register a one-time listener")
        .up (s => s.pluginArgs = ["click", { prePost: true, listenerName: "TestListener" }])
        .up (s => s.args = ["click", function () { s.clicked = ~~s.clicked + 1; }])
        .before (s => s.Listener = nit.defineClass ("test.MyListener", "test.PluginHost.TestListener")
            .onPreClick (async (v) => { await nit.sleep (10); s.preClickValue = v; })
            .onPostClick (v => s.postClickValue = v)
            .onClick (v => s.clickValue = v)
        )
        .before (s => s.AnotherListener = s.hostClass.defineTestListener ("AnotherListener")
            .onPostClick (v => s.anotherPostClickValue = v)
        )
        .before (s => s.hostClass.testlistener ("test.MyListener"))
        .before (s => s.hostClass.testlistener (new s.AnotherListener))
        .after (s => s.host.emit ("preClick", 3))
        .after (s => s.host.emit ("click", 3))
        .after (s => s.host.emit ("postClick", 3))
        .after (s => s.host.emit ("preClick", 4))
        .after (s => s.host.emit ("click", 4))
        .after (s => s.host.emit ("postClick", 4))
        .expectingPropertyToBe ("clicked", 1)
        .expectingPropertyToBe ("preClickValue", 4)
        .expectingPropertyToBe ("postClickValue", 4)
        .expectingPropertyToBe ("clickValue", 4)
        .expectingPropertyToBe ("anotherPostClickValue", 4)
        .commit ()
;

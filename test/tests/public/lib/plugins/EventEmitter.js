test.method ("plugins.EventEmitter", "onUsePlugin", true)
    .should ("add the on method to the host class")
        .up (s => s.Server = nit.defineClass ("Server"))
        .up (s => s.args = [s.Server, new s.class ("start", "stop")])
        .after (s =>
        {
            let server = s.server = new s.Server;

            server.on ("start", v => s.startArg = v);
            server.on ("stop", v => s.stopArg = v);

            server.emit ("start", 5);
            server.emit ("stop", 7);
        })
        .expectingPropertyToBe ("startArg", 5)
        .expectingPropertyToBe ("stopArg", 7)
        .expectingMethodToThrow ("server.on", "dispatch", /not supported/)
        .commit ()
;


test.method ("plugins.EventEmitter", "onUsePlugin", true)
    .should ("add the off method to the host class")
        .up (s => s.Server = nit.defineClass ("Server"))
        .up (s => s.args = [s.Server, new s.class ("start", "stop")])
        .after (s =>
        {
            let server = s.server = new s.Server;
            let onStop1 = function () { s.stop1 = true; };
            let onStop2 = function () { s.stop2 = true; };

            server.on ("start", v => s.startArg = v);
            server.on ("stop", onStop1);
            server.on ("stop", onStop2);
            server.off ("stop", onStop1);

            server.emit ("start", 5);
            server.emit ("stop", 7);
        })
        .expectingPropertyToBe ("startArg", 5)
        .expectingPropertyToBe ("stop2", true)
        .expectingMethodToThrow ("server.off", "dispatch", /not supported/)
        .expectingPropertyToBe ("server.listeners.$stop.length", 1)
        .expectingMethodToReturnValueOfType ("server.off", "stop", "Server")
        .expectingPropertyToBe ("server.listeners.$stop.length", 0)
        .commit ()
;


test.method ("plugins.EventEmitter", "onUsePlugin", true)
    .should ("add the emit method to the host class")
        .up (s => s.Server = nit.defineClass ("Server"))
        .up (s => s.args = [s.Server, new s.class ("start", "stop")])
        .after (async (s) =>
        {
            s.results = [];

            let server = s.server = new s.Server;
            let onStop1 = async function () { await nit.sleep (10); s.results.push (1); };
            let onStop2 = async function () { await nit.sleep (10); s.results.push (2); };

            server.on ("stop", onStop1);
            server.on ("stop", onStop2);

            await server.emit ("stop");
        })
        .expectingPropertyToBe ("results", [1, 2])
        .commit ()
;

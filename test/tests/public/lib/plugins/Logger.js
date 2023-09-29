beforeAll (async () =>
{
    jest.resetModules ();

    test.nit = await test.reloadNit ();
    test.Logger = test.nit.requireAsset ("public/lib/plugins/Logger");
});


test.object ("plugins.Logger", true, "timestampEnabled")
    .should ("return true if the log message should be prepended with the current timestamp")
        .up (s => s.class = test.Logger)
        .before (s => s.class.timestamp = true)
        .returns (true)
        .commit ()

    .given ({ timestamp: true })
        .before (s => s.class.timestamp = null)
        .returns (true)
        .commit ()

    .given ()
        .returns (false)
        .commit ()

    .given ({ timestamp: false })
        .before (s => s.class.timestamp = true)
        .returns (false)
        .commit ()
;


test.object ("plugins.Logger", true, "prefix")
    .should ("return the current timestamp")
        .up (s => s.class = test.Logger)
        .before (s => s.class.timestamp = true)
        .returns (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} $/)
        .commit ()

    .reset ()
        .before (s => s.class.timestamp = null)
        .returns ("")
        .commit ()
;


test.object ("plugins.Logger", true, "stack")
    .should ("return the stack trace if enabled")
        .up (s => s.class = test.Logger)
        .given ({ stackTrace: true })
        .returns (/\n\s+at\s.*/)
        .commit ()

    .should ("return empty string if not enabled")
        .returns ("")
        .commit ()
;


test.method ("plugins.Logger", "registerTransform")
    .should ("register a template transform")
        .up (s => s.class = test.Logger)
        .given ("addOne", v => v + 1)
        .returnsInstanceOf ("plugins.Logger")
        .expectingMethodToReturnValue ("result.transforms.addOne", 2, 3)
        .commit ()
;


test.method ("plugins.Logger", "formatMessage")
    .should ("format the log message")
        .up (s => s.class = test.Logger)
        .before (s =>
        {
            s.Host = nit.defineClass ("Host")
                .m ("info.hello", "Hello there!")
            ;

            s.args = [new s.Host, "info.hello"];
        })
        .returns ("Hello there!")
        .commit ()

    .should ("return the stack trace if given an error")
        .before (s =>
        {
            s.args = [new s.Host, new Error ("ERR")];
        })
        .returns (/^Error: ERR/)
        .commit ()

    .should ("return the stringified string if given an object ")
        .before (s =>
        {
            s.args = [new s.Host, { a: 1 }];
        })
        .returns (`{"a":1}`)
        .commit ()
;


test.method ("plugins.Logger", "onUsePlugin", true)
    .preCommit (s => s.description += " -> hostClass.logLevelPrefix ()")
    .snapshot ()
    .should ("add level prefix to the log message")
        .up (s => s.class = test.Logger)
        .before (s => s.logMock = test.mock (test.nit, "log", null, 4))
        .before (() => test.nit.log.LEVELS = ["info", "debug"])
        .before (() => test.nit.debug ("test.Host"))
        .before (s => s.args =[test.nit.defineClass ("test.Host"), test.nit.new (test.Logger, { timestamp: true })])
        .after (s => s.host = test.nit.new ("test.Host"))
        .expectingMethodToReturnValue ("args.0.logLevelPrefix", "info", "[INFO] ")
        .expectingMethodToReturnValue ("args.0.logLevelPrefix", "debug", "[DEBUG] (test.Host) ")
        .expectingMethodToReturnValue ("args.0.logPrefix", "info", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[INFO\] $/)
        .expectingMethodToReturnValueOfType ("host.writeLog", "the message", "test.Host")
        .expectingPropertyToBe ("logMock.invocations.0.args.0", "the message")
        .expectingMethodToReturnValueOfType ("host.log", "the log message", "test.Host")
        .expectingPropertyToBe ("logMock.invocations.1.args.0", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} the log message$/)
        .expectingMethodToReturnValueOfType ("host.info", "the info message", "test.Host")
        .expectingPropertyToBe ("logMock.invocations.2.args.0", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[INFO\] the info message$/)
        .expectingMethodToReturnValueOfType ("host.debug", "the debug message", "test.Host")
        .expectingPropertyToBe ("logMock.invocations.3.args.0", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[DEBUG\] \(test.Host\) the debug message$/)
        .commit ()

    .should ("not log debug message if not enabled")
        .up (s => s.class = test.Logger)
        .up (() => test.Logger.timestamp = false)
        .before (s => s.logMock = test.mock (test.nit, "log", null, 4))
        .before (() => test.nit.log.LEVELS = ["info", "debug"])
        .before (s => s.args = [test.nit.defineClass ("test.Host2"), new test.Logger])
        .after (s => s.host = test.nit.new ("test.Host2"))
        .expectingMethodToReturnValueOfType ("host.debug", "the debug message", "test.Host2")
        .expectingPropertyToBe ("logMock.invocations.length", 0)
        .expectingMethodToReturnValueOfType ("host.info", nit.trim.text (`
A multi-line
message
`), "test.Host2")
        .expectingPropertyToBe ("logMock.invocations.0.args.0", `[INFO] A multi-line
    message`)
        .commit ()
;

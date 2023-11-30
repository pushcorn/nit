beforeAll (async () =>
{
    nit.resetRequireCache ();

    delete nit.CLASSES["plugins.Logger"];
    delete nit.CLASSES["plugins.Logger.Logger"];
    delete nit.CLASSES["plugins.Logger.Logger.Transforms"];

    nit.requireAsset ("public/lib/plugins/Logger");
});


test.method ("plugins.Logger.Logger", "formatStack")
    .should ("NOT append the stack trace if stackTrace is false")
        .up (s => s.class.colorize = false)
        .up (s => s.class = s.class.defineSubclass ("test.Logger"))
        .given (null, "message without stack")
        .returns ("message without stack")
        .commit ()

    .should ("append the stack trace if stackTrace is true")
        .up (s => s.class = s.class.defineSubclass ("test.Logger")
          .meta ("stackTrace", true)
        )
        .given (null, "message with stack")
        .returns (/message with stack[\s\S]+nit_test_strategies_Method.*/)
        .commit ()
;


test.method ("plugins.Logger.Logger", "formatPrefix")
    .should ("NOT prepend the timestamp if timestamp is false")
        .up (s => s.class = s.class.defineSubclass ("test.Logger"))
        .given (null, "message without timestamp")
        .returns ("message without timestamp")
        .commit ()

    .should ("prepend the timestamp if timestamp is true")
        .up (s => s.class = s.class.defineSubclass ("test.Logger")
          .meta ("timestamp", true)
        )
        .given (null, "message with timestamp")
        .returns (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} message with timestamp$/)
        .commit ()
;


test.method ("plugins.Logger.Logger", "formatLevel")
    .should ("prepend the log level")
        .up (s => s.class = s.class.defineSubclass ("test.Logger"))
        .given (null, "info", "message")
        .returns ("[INFO] message")
        .commit ()

    .should ("add the class name for the debug level")
        .up (s => s.class = s.class.defineSubclass ("test.Logger"))
        .up (s => s.args = [s, "debug", "message"])
        .returns ("[DEBUG] (nit.test.strategies.Method) message")
        .commit ()
;


test.method ("plugins.Logger.Logger", "formatMessage")
    .should ("format the message")
        .up (s => s.plugin = new s.class.outerClass)
        .up (s => s.class = s.class.defineSubclass ("test.Logger"))
        .up (s => s.hostClass = nit.defineClass ("test.Host")
            .m ("info.hello", "Hello %{name|ucFirst}!")
        )
        .up (s => s.plugin.usedBy (s.hostClass))
        .up (s => s.hostClass.defineLogger (Logger => Logger.transform ("ucFirst", v => nit.ucFirst (v))))
        .up (s => s.args = [new s.hostClass, "info.hello", [{ name: "there" }]])
        .returns ("Hello There!")
        .commit ()

    .should ("return the stack trace if given an error")
        .up (s => s.args = [new s.hostClass, new Error ("ERR")])
        .returns (/^Error: ERR/)
        .commit ()

    .should ("return the stringified string if given an object")
        .up (s => s.args = [new s.hostClass, { a: 1 }])
        .returns (`{"a":1}`)
        .commit ()

    .should ("indent the message if it contains a newline")
        .up (s => s.args = [new s.hostClass, "1\n2\n3"])
        .returns (nit.trim.text`
        1
            2
            3
        `)
        .commit ()
;


test.method ("plugins.Logger.Logger", "writeLog")
    .should ("write the log to console")
        .up (s => s.class = s.class.defineSubclass ("test.Logger"))
        .mock (nit, "log")
        .given ("test message")
        .returnsInstanceOf ("test.Logger")
        .expectingPropertyToBe ("mocks.0.invocations.0.args", ["test message"])
        .commit ()
;


test.method ("plugins.Logger.Logger", "log")
    .should ("format and log the message")
        .up (s => s.plugin = new s.class.outerClass)
        .up (s => s.class = s.class.defineSubclass ("test.Logger"))
        .up (s => s.hostClass = nit.defineClass ("test.Host")
            .m ("info.hello", "Hello %{name|ucFirst}!")
        )
        .up (s => s.plugin.usedBy (s.hostClass))
        .up (s => s.hostClass.defineLogger (Logger => Logger.transform ("ucFirst", v => nit.ucFirst (v))))
        .up (s => s.args = [new s.hostClass, "info", "info.hello", { name: "here" }])
        .mock ("object", "writeLog")
        .expectingPropertyToBe ("mocks.0.invocations.0.args", ["[INFO] Hello Here!"])
        .commit ()

    .should ("NOT log the debug message if not enabled for the host class")
        .up (s => s.args = [new s.hostClass, "debug", "info.hello", { name: "here" }])
        .mock ("object", "writeLog")
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .commit ()

    .should ("log the debug message if enabled for the host class")
        .up (s => s.plugin = new s.class.outerClass)
        .up (s => s.hostClass = nit.defineClass ("test.Host")
            .m ("info.hello", "Hello %{name|ucFirst}!")
        )
        .up (s => s.plugin.usedBy (s.hostClass))
        .up (s => s.hostClass.defineLogger (Logger => s.class = Logger.transform ("ucFirst", v => nit.ucFirst (v))))
        .up (() => nit.debug ("test.Host"))
        .up (s => s.args = [new s.hostClass, "debug", "info.hello", { name: "here" }])
        .mock ("object", "writeLog")
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.0.invocations.0.args", ["[DEBUG] (test.Host) Hello Here!"])
        .commit ()
;


test.plugin ("plugins.Logger", "info")
    .should ("log the info message")
        .up (s => s.hostClass.m ("info.hello", "Hello %{name|nit.ucFirst}!"))
        .mock ("hostClass.Logger.prototype", "writeLog")
        .given ("info.hello", { name: "john" })
        .expectingPropertyToBe ("mocks.0.invocations.0.args", ["[INFO] Hello John!"])
        .commit ()
;

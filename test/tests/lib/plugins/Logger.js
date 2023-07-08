test.object ("plugins.Logger", true, "timestampEnabled")
    .should ("return true if the log message should be prepended with the current timestamp")
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
        .given ({ stackTrace: true })
        .returns (/\n\s+at\s.*/)
        .commit ()

    .should ("return empty string if not enabled")
        .returns ("")
        .commit ()
;


test.method ("plugins.Logger", "registerTransform")
    .should ("register a template transform")
        .given ("addOne", v => v + 1)
        .returnsInstanceOf ("plugins.Logger")
        .expectingMethodToReturnValue ("result.transforms.addOne", 2, 3)
        .commit ()
;


test.method ("plugins.Logger", "formatMessage")
    .should ("format the log message")
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


test.object ("plugins.Logger.Mixin", false, "logger")
    .should ("return the logger of the host class")
    .before (s =>
    {
        s.Logger = s.class.outerClass;
        s.Host = nit.defineClass ("Host")
            .m ("info.hello", "Hello there!")
        ;

        s.Logger.onUsePlugin (s.Host, new s.Logger);
        s.object = s.Host;
    })
    .returnsInstanceOf ("plugins.Logger")
    .commit ()
;


test.method ("plugins.Logger.Mixin", "log")
    .should ("log the message to the console")
    .before (s =>
    {
        s.Logger = s.class.outerClass;
        s.Host = nit.defineClass ("Host")
            .m ("info.hello", "Hello there!")
        ;

        s.Logger.onUsePlugin (s.Host, new s.Logger);
        s.object = new s.Host;
    })
    .given ("info.hello")
    .mock (nit, "log")
    .returnsInstanceOf ("Host")
    .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "Hello there!")
    .commit ()
;


test.method ("plugins.Logger.Mixin", "info")
    .should ("log the info message to the console")
        .before (s =>
        {
            s.Logger = s.class.outerClass;
            s.Host = nit.defineClass ("Host")
                .m ("info.hello", "Hello there!")
                .m ("info.multiline", nit.trim.text`
                    Line 1
                    Line 2
                `)
            ;

            s.Logger.onUsePlugin (s.Host, new s.Logger);
            s.object = new s.Host;
        })
        .given ("info.hello")
        .mock (nit, "log")
        .returnsInstanceOf ("Host")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "\x1B[32m[INFO] \x1B[39mHello there!")
        .commit ()

    .should ("indent the log message if it contains multiple lines")
        .before (s =>
        {
            s.object = new s.Host;
        })
        .given ("info.multiline")
        .mock (nit, "log")
        .returnsInstanceOf ("Host")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "\x1B[32m[INFO] \x1B[39mLine 1\n    Line 2")
        .commit ()

    .should ("include the timestamp if enabled")
        .before (s =>
        {
            s.Host = nit.defineClass ("Host")
                .m ("info.hello", "Hello there!")
            ;

            s.Logger.onUsePlugin (s.Host, new s.Logger ({ timestamp: true }));
            s.object = new s.Host;
        })
        .given ("info.hello")
        .mock (nit, "log")
        .returnsInstanceOf ("Host")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[INFO] Hello there!$/)
        .commit ()
;


test.method ("plugins.Logger.Mixin", "debug")
    .should ("log the debug message to the console")
        .before (s =>
        {
            s.Logger = s.class.outerClass;
            s.Host = nit.defineClass ("Host")
                .m ("info.hello", "Hello there!")
            ;

            s.Logger.onUsePlugin (s.Host, new s.Logger);
            s.object = new s.Host;

            nit.debug ("Host");
        })
        .given ("info.hello")
        .mock (nit, "log")
        .returnsInstanceOf ("Host")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "\x1B[33m[DEBUG] (Host) \x1B[39mHello there!")
        .commit ()

    .should ("NOT log the debug message to the console if the debug is not enabled for the class")
        .before (s =>
        {
            nit.debug.PATTERNS = [];

            s.object = new s.Host;
        })
        .given ("info.hello")
        .mock (nit, "log")
        .returnsInstanceOf ("Host")
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
        .commit ()
;

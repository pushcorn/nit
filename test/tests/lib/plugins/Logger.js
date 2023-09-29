test.object ("plugins.Logger", true, "colorEnabled")
    .should ("be true if the stdout is a TTY")
        .given ()
        .returns (true)
        .commit ()

    .should ("be false if the TERM env var is 'dumb'")
        .before (s => s.TERM = nit.ENV.TERM)
        .before (() => nit.ENV.TERM = "dumb")
        .after (s => nit.ENV.TERM = s.TERM)
        .returns (false)
        .commit ()

    .should ("be false if colorize if false")
        .given ({ colorize: false })
        .returns (false)
        .commit ()
;


test.method ("plugins.Logger", "onUsePlugin", true)
    .preCommit (s => s.description += " -> hostClass.logLevelColor ()")
    .snapshot ()
    .should ("return the color of a supported level")
        .given (nit.defineClass ("test.Host"), nit.new ("plugins.Logger"))
        .expectingMethodToReturnValue ("args.0.logLevelColor", "error", "red")
        .commit ()

    .should ("return a class-specific color for an unsupported level")
        .given (nit.defineClass ("test.Host2"), nit.new ("plugins.Logger"))
        .expectingMethodToReturnValue ("args.0.logLevelColor", "debug", "green")
        .commit ()
;


test.method ("plugins.Logger", "onUsePlugin", true)
    .preCommit (s => s.description += " -> hostClass.prototype.info ()")
    .snapshot ()
    .should ("make the host to log with color code")
        .before (s => s.logMock = test.mock (nit, "log"))
        .before (() => nit.log.LEVELS = ["info", "debug"])
        .given (nit.defineClass ("test.Host"), nit.new ("plugins.Logger"))
        .after (s => s.host = nit.new ("test.Host"))
        .expectingMethodToReturnValueOfType ("host.info", "the info message", "test.Host")
        .expectingPropertyToBe ("logMock.invocations.0.args.0", "\x1B[32m[INFO] \x1B[39mthe info message")
        .commit ()

    .should ("make the host to log without color code if process.stdout.isTTY is false")
        .before (s => s.logMock = test.mock (nit, "log"))
        .before (() => nit.log.LEVELS = ["info", "debug"])
        .given (nit.defineClass ("test.Host2"), nit.new ("plugins.Logger"))
        .after (s => s.host = nit.new ("test.Host2"))
        .after (() => process.stdout.isTTY = false)
        .expectingMethodToReturnValueOfType ("host.info", "the info message", "test.Host2")
        .expectingPropertyToBe ("logMock.invocations.0.args.0", "[INFO] the info message")
        .commit ()
;

test.method ("plugins.Logger.Logger", "colorForLevel")
    .should ("return the color for the given level")
        .given ({}, "info")
        .returns ("green")
        .commit ()

    .should ("return a generated color if no color was defined for the level")
        .given ({}, "none")
        .returns ("cyan")
        .commit ()
;


test.method ("plugins.Logger.Logger", "formatLevel")
    .should ("colorize the level prefix if colorize is undefined")
        .given (null, "info", "message 1")
        .returns ("\x1B[1m\x1B[32m[INFO] \x1B[39m\x1B[22mmessage 1")
        .commit ()

    .should ("add the host's class name if debug is enabled")
        .up (s => s.hostClass = nit.defineClass ("test.LogHost"))
        .up (s => s.host = new s.hostClass)
        .up (s => nit.debug (s.hostClass.name))
        .up (s => s.args = [s.host, "debug", "message 1"])
        .returns ("\x1B[1m\x1B[35m[DEBUG] (test.LogHost) \x1B[39m\x1B[22mmessage 1")
        .commit ()

    .should ("colorize the level prefix if colorize is true")
        .up (s => s.class.colorize = true)
        .given (null, "info", "message 1")
        .returns ("\x1B[1m\x1B[32m[INFO] \x1B[39m\x1B[22mmessage 1")
        .commit ()

    .should ("NOT colorize the level prefix if colorize is false")
        .up (s => delete s.class.$__colorEnabled)
        .up (s => s.class.colorize = false)
        .given (null, "info", "message 1")
        .returns ("[INFO] message 1")
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

    .should ("colorize the level prefix if colorize is true")
        .up (s => s.class.$__colorEnabled = true)
        .given (null, "message 1")
        .returns ("message 1")
        .commit ()
;

const { bold, underline } = nit.require ("nit.utils.Colorizer");

let readableListener;


test.method ("nit.utils.Stdio", "prompt", true)
    .mock (process.stdout, "write")
    .mock (process.stdin, "setRawMode", () => process.stdin)
    .mock (process.stdin, "once", (event, l) => readableListener = l)
    .before (() => setTimeout (() => readableListener (), 50))
    .given ("are you sure?")
    .snapshot ()

    .should ("show the message again if the answer is invalid")
        .mock (process.stdin, "read", function ()
        {
            return Buffer.from (this.invocations.length == 0 ? "x" : "n");
        })
        .before (() => setTimeout (() => readableListener (), 100))
        .returns ("n")
        .expectingPropertyToBe ("mocks.0.invocations.length", 4)
        .commit ()

    .should ("prompt the user for input")
        .mock (process.stdin, "read", () => Buffer.from ("y"))
        .returns ("y")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "are you sure? (" + underline (bold ("Y")) + "es/" + underline (bold ("N")) + "o) ")
        .commit ()

    .should ("cancel if CTRL+C was pressed")
        .mock (process.stdin, "read", () => Buffer.from (String.fromCharCode (3)))
        .returns ("")
        .commit ()

    .should ("cancel if ESC was pressed")
        .mock (process.stdin, "read", () => Buffer.from (String.fromCharCode (27)))
        .returns ("")
        .commit ()
;


test.method ("nit.utils.Stdio", "confirm", true)
    .should ("return true if the input is 'y'")
        .given ("are you sure?")
        .mock (process.stdout, "write")
        .mock (process.stdin, "setRawMode", () => process.stdin)
        .mock (process.stdin, "once", (event, l) => readableListener = l)
        .before (() => setTimeout (() => readableListener (), 50))
        .mock (process.stdin, "read", () => Buffer.from ("y"))
        .returns (true)
        .commit ()
;


test.method ("nit.utils.Stdio", "readLine", true)
    .should ("should display the message again if CTRL+U is pressed")
        .given ("please enter something:")
        .before (function ()
        {
            this.readline = require ("readline");

            setTimeout (() => this.mocks[0].onAnswer ("my reply"), 100);
        })
        .mock ("readline", "createInterface", function ()
        {
            let mock = this;
            let strategy = mock.strategy;

            return {
                close: nit.noop,
                question: function (question, onAnswer)
                {
                    mock.question = question;
                    mock.onAnswer = onAnswer;

                    strategy.onKeypress ("A");
                    strategy.onKeypress ("\u0015");
                }
            };
        })
        .mock (process.stdin, "on", function (event, onKeypress)
        {
            this.strategy.onKeypress = onKeypress;
        })
        .mock (process.stdout, "write")
        .mock ("readline", "moveCursor", function (stdout, dx, dy, cb)
        {
            cb ();
        })
        .returns ("my reply")
        .expectingPropertyToBe ("mocks.2.invocations.0.args.0", /please enter something/i)
        .expectingPropertyToBe ("mocks.2.invocations.length", 2)
        .commit ()

    .should ("should no show the input if hideInput is true")
        .given ("please enter something:", true)
        .before (function ()
        {
            this.readline = require ("readline");

            setTimeout (() => this.mocks[0].onAnswer ("my secret"), 100);
        })
        .mock ("readline", "createInterface", function ()
        {
            let mock = this;

            return {
                close: nit.noop,
                question: function (question, onAnswer)
                {
                    mock.question = question;
                    mock.onAnswer = onAnswer;
                }
            };
        })
        .mock (process.stdout, "write")
        .returns ("my secret")
        .expectingPropertyToBe ("mocks.0.invocations.0.result._writeToOutput", nit.noop)
        .commit ()
;


module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.utils.Stdio"))
        .require ("nit.utils.Colorizer")
        .defineInnerClass ("Options", Options =>
        {
            Options
                .field ("[spec]", "string", "The options spec.", "&Yes/&No")
                .property ("allowed...", "string")
                .property ("formattedString")

                .onConstruct (function (spec)
                {
                    this.formattedString = spec.replace (/(&(\w))/g, ($0, $1, ch) =>
                    {
                        this.allowed.push (ch.toLowerCase ());

                        return nit.utils.Colorizer.underline (nit.utils.Colorizer.bold (ch));
                    });
                })
                .method ("includes", function (char)
                {
                    return this.allowed.includes (char.toLowerCase ());
                })
            ;
        })
        .staticMethod ("confirm", async function (message)
        {
            return await Self.prompt (message) == "y";
        })
        .staticMethod ("prompt", async function (message, optionsSpec)
        {
            let answer;
            let options = new Self.Options (optionsSpec);

            do
            {
                process.stdout.write (`${message} (${options.formattedString}) `);

                answer = await new Promise (function (resolve)
                {
                    process.stdin
                        .setRawMode (true)
                        .once ("readable", function ()
                        {
                            let data = process.stdin
                                .setRawMode (false)
                                .read ();

                            let char = (data[0] == 3 || data[0] == 27) ? "" : String.fromCharCode (data[0]); // quit if CTRL+C or ESC is entered

                            process.stdout.write (char + "\n");

                            resolve (char);
                        })
                    ;
                });

                answer = answer.toLowerCase ();
            }
            while (answer && !options.includes (answer));

            return answer;
        })
        .staticMethod ("readLine", function (message, hideInput)
        {
            const no_readline = require ("readline");

            let readline = no_readline.createInterface (
            {
                input: process.stdin,
                output: process.stdout
            });

            function onKeypress (c)
            {
                if (c == "\u0015") // CTRL+U
                {
                    no_readline.moveCursor (process.stdout, -message.length - 1, 0, function ()
                    {
                        process.stdout.write (message + " ");
                    });
                }
            }

            process.stdin.on ("keypress", onKeypress);

            return new Promise (function (resolve)
            {
                readline.question (message + " ", function (answer)
                {
                    readline.close ();
                    process.stdout.write ("\n");
                    process.stdin.off ("keypress", onKeypress);

                    resolve (answer);
                });

                if (hideInput)
                {
                    readline._writeToOutput = nit.noop;
                }
            });
        })
    ;
};

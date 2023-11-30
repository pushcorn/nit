test.method ("nit.utils.Shell", "run", true)
    .should ("run a shell command")
        .given ("nit test:not-found")
        .mock ("class", "spawn", function ()
        {
            return {
                stdout:
                {
                    on: () => {}
                }
                ,
                stderr:
                {
                    on: () => {}
                }
                ,
                on: (event, listener) =>
                {
                    listener (9);
                }
            };
        })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "nit test:not-found")
        .expectingPropertyToBe ("result.exitCode", 9)
        .commit ()

    .should ("run a shell command with specified env")
        .up (s => s.args = ["nit test:not-found", new s.class.Options ({ env: { a: 1 } })])
        .mock ("class", "spawn", function (command, args, options)
        {
            this.strategy.env = options.env;

            return {
                stdout:
                {
                    on: (event, listener) =>
                    {
                        listener (Buffer.from ("stdout"));
                    }
                }
                ,
                stderr:
                {
                    on: (event, listener) =>
                    {
                        listener (Buffer.from ("stderr"));
                    }
                }
                ,
                on: (event, listener) =>
                {
                    listener (10);
                }
            };
        })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "nit test:not-found")
        .expectingPropertyToBe ("result.exitCode", 10)
        .expectingPropertyToBe ("result.stdout", "stdout")
        .expectingPropertyToBe ("result.stderr", "stderr")
        .expectingPropertyToContain ("env", { a: 1 })
        .commit ()
;

module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.utils.Shell"))
        .use ("*child_process.spawn")
        .defineInnerClass ("Options", Options =>
        {
            Options
                .field ("shell", "boolean|string", "Use shell to run the command.", true)
                .field ("detached", "boolean", "Prepare child to run independently of its parent process.", true)
                .field ("env", "object", "Additional environment variables.")
                .field ("cwd", "string", "Current working directory of the child process.")
            ;
        })
        .defineInnerClass ("Output", Output =>
        {
            Output
                .field ("stdout", "string", "Output from stdout.")
                .field ("stderr", "string", "Output from stderr.")
                .field ("exitCode", "integer", "The command exit code.")
            ;
        })
        .staticTypedMethod ("run",
            {
                command: "string", args: "array", options: ["dto", Self.Options]
            },
            async function (command, args, options)
            {
                let deferred = new nit.Deferred;
                let stdoutBuffers = [];
                let stderrBuffers = [];

                if (!(options instanceof Self.Options))
                {
                    options = new Self.Options (options);
                }

                options.env = nit.assign ({}, process.env, options.env);

                let child = Self.spawn (command, args, options);

                child.stdout.on ("data", data =>
                {
                    stdoutBuffers.push (data);
                });

                child.stderr.on ("data", data =>
                {
                    stderrBuffers.push (data);
                });

                child.on ("close", exitCode =>
                {
                    let output = new Self.Output (
                    {
                        exitCode,
                        stdout: nit.trim (Buffer.concat (stdoutBuffers).toString ()),
                        stderr: nit.trim (Buffer.concat (stderrBuffers).toString ())
                    });

                    deferred.resolve (output);
                });

                return await deferred;
            }
        )
    ;
};

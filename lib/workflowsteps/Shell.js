module.exports = function (nit, Self)
{
    return (Self = nit.defineWorkflowStep ("Shell"))
        .use ("nit.utils.Shell")
        .m ("error.shell_error", "Error running the shell command '%{command}'. (Exit code: %{exitCode})\n\n%{output}")
        .field ("<command>", "string", "The command to run.", { exprAllowed: true })
        .field ("[args...]", "string", "Additional command arguments.", { exprAllowed: true })
        .field ("cwd", "string", "Current working directory of the child process.", { exprAllowed: true })
        .field ("shell", "boolean|string", "Use shell to run the command.", true, { exprAllowed: true })
        .field ("env", "object", "Additional environment variables.", { exprAllowed: true })

        .onRun (async function ()
        {
            let self = this;
            let { command, args } = self;
            let output = await Self.Shell.run (
                command,
                args,
                new Self.Shell.Options (self.toPojo ())
            );

            let { stdout, stderr, exitCode } = output;

            output = [stdout, stderr].filter (nit.is.not.empty).join ("\n");

            if (exitCode)
            {
                self.throw ("error.shell_error", { command, exitCode, output });
            }

            return output;
        })
    ;
};

module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Shell"))
        .m ("error.shell_error", "Error running the shell command '%{command}'. (Exit code: %{exitCode})\n\n%{output}")
        .describe ("Run a shell command.")
        .use ("nit.utils.Shell")
        .plugin ("compgen-completer")
        .defineCompgenCompleter (Completer =>
        {
            Completer
                .completeForOption ("commands.Shell.command", async (ctx) =>
                {
                    let commands = (await Self.Shell.run ("compgen -c")).stdout;

                    commands = nit.trim (commands).split ("\n").filter (c => c.match (/\w+/));

                    return [nit.Compgen.ACTIONS.VALUE, ...ctx.filterCompletions (commands)];
                })
            ;
        })
        .defineInput (Input =>
        {
            Input
                .option ("<command>", "string", "The command to run.")
                .option ("[args...]", "string", "Additional command arguments.")
                .option ("cwd", "string", "Current working directory of the child process.")
                .option ("shell", "boolean|string", "Use shell to run the command.", true)
                .option ("env", "object", "Additional environment variables.")
                .option ("noError", "boolean", "Do not throw on non-zero exit code.")
            ;
        })
        .onRun (async function (ctx)
        {
            let { command, args, noError } = ctx.input;
            let output = await Self.Shell.run (
                command,
                args,
                new Self.Shell.Options (ctx.input.toPojo ())
            );

            let { stdout, stderr, exitCode } = output;

            ctx.output = [stdout, stderr].filter (nit.is.not.empty).join ("\n");

            if ((ctx.exitCode = exitCode) && !noError)
            {
                this.throw ("error.shell_error", { command, exitCode: exitCode, output: ctx.output });
            }
        })
    ;
};

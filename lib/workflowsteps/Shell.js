module.exports = function (nit, Self)
{
    return (Self = nit.defineWorkflowStep ("Shell"))
        .use ("*child_process.spawn")
        .m ("error.shell_error", "Error running the shell command '%{command}'. (Cause: %{cause})")
        .field ("<command>", "string", "The command to run.", { exprAllowed: true })
        .field ("shell", "boolean|string", "Use shell to run the command.", true, { exprAllowed: true })
        .field ("env", "object", "Additional environment variables", { exprAllowed: true })
        .onRun (async function ()
        {
            let self = this;
            let deferred = new nit.Deferred;
            let stdoutBuffers = [];
            let stderrBuffers = [];
            let stdout, stderr;
            let child = Self.spawn (self.command,
            {
                shell: self.shell,
                detached: true,
                env: nit.assign ({}, process.env, self.env)
            });

            child.stdout.on ("data", data =>
            {
                stdoutBuffers.push (data);
            });

            child.stderr.on ("data", data =>
            {
                stderrBuffers.push (data);
            });

            child.on ("close", code =>
            {
                stdout = nit.trim (Buffer.concat (stdoutBuffers).toString ());
                stderr = nit.trim (Buffer.concat (stderrBuffers).toString ());

                if (code == 0)
                {
                    deferred.resolve (code);
                }
                else
                {
                    deferred.reject (code);
                }
            });

            try
            {
                await deferred;

                return stdout;
            }
            catch (e)
            {
                self.throw ("error.shell_error", { cause: stderr.length ? stderr : stdout });
            }
        })
    ;
};

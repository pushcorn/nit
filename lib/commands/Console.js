module.exports = function (nit)
{
    return nit.defineCommand ("commands.Console")
        .describe ("Start the interactive shell.")
        .defineInput (Input =>
        {
            Input
                .option ("welcome", "string", "The welcome message.", "Welcome to the nit console!")
                .option ("prompt", "string",  "The prompt string.", "> ")
                .option ("history", "nit.File", "The history file.", "~/.node_repl_history")
                .option ("noUseGlobal", "boolean", "Whether to use 'global' as the context.")
                .option ("requires...", "file", "Other files to require.")
            ;
        })
        .onRun (async function (ctx)
        {
            let { welcome, prompt, history, noUseGlobal, requires } = ctx.input;

            await nit.requireAll (...requires);

            nit.log (welcome);

            const repl = require ("repl");

            let server = repl.start ({ prompt, useGlobal: !noUseGlobal });
            let lastLine;

            server.context.nit = nit;

            try
            {
                server.history = history.exists () && history.stat ().size ? history.read ().split("\n") : [];
                lastLine = server.history[0];
            }
            catch (e)
            {
            }

            server
                .on ("line", function (code)
                {
                    if (code && lastLine !== code)
                    {
                        lastLine = code;

                        history.write (server.history.join ("\n"));
                    }
                })
                .on ("exit", function ()
                {
                    process.emit ("SHUTDOWN");
                    process.exit (); // eslint-disable-line no-process-exit
                })
            ;
        })
    ;
};

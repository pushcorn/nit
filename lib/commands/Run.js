module.exports = function (nit)
{
    return nit.defineCommand ("commands.Run")
        .describe ("Run a JavaScript file with nit.")
        .defineInput (Input =>
        {
            Input.option ("<file>", "file", "The file to run.");
        })
        .onRun (async function (ctx)
        {
            let { file } = ctx.input;

            global.nit = nit;

            if (!nit.path.isAbsolute (file))
            {
                file = nit.path.join (process.cwd (), file);
            }

            return await nit.require (file);
        })
    ;
};

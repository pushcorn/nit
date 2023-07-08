module.exports = function (nit)
{
    return nit.test.defineStrategy ("nit.test.strategies.Command")
        .require ("nit.Command")
        .field ("<command>", "nit.Command.Type", "The command to test.")

        .property ("class", "function")
        .property ("object", "nit.Command")
        .property ("context", "nit.Command.Context")

        .onConstruct (function (command)
        {
            let cls = command.lookup ();

            this.class = cls;
            this.description = this.description || `Command: ${cls.name}`;
        })
        .onTestUp (async function ()
        {
            let cls = this.class;
            let input = cls.Input.fromArgv (...arguments);

            this.context = await new cls.Context (input);
            this.object = await new cls;
        })
        .onTest (async function ()
        {
            let cmd = this.object;
            let ctx = this.context;

            try
            {
                return await cmd.run (ctx);
            }
            catch (e)
            {
                Object.setPrototypeOf (e, Error.prototype); // In test mode, native errors are not instances of Error.
                ctx.error = e;

                await cmd.catch (ctx);
            }
            finally
            {
                await cmd.finally (ctx);
            }
        })
    ;
};

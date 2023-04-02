module.exports = function (nit)
{
    return nit.test.defineStrategy ("nit.test.strategies.Command")
        .require ("nit.Command")
        .field ("<command>", "nit.Command.Type", "The command to test.")

        .property ("class", "function")
        .property ("object", "nit.Command")
        .property ("context", "nit.Command.Context")

        .construct (function (command)
        {
            let cls = command.lookup ();

            this.class = cls;
            this.description = this.description || `Command: ${cls.name}`;
        })
        .testUp (async function (argv) // eslint-disable-line no-unused-vars
        {
            let cls = this.class;
            let input = cls.Input.fromArgv (...arguments);

            this.context = await new cls.Context (input);
            this.object = await new cls;
        })
        .test (async function ()
        {
            let cmd = this.object;
            let ctx = this.context;

            try
            {
                return await this.class.runCommand (cmd, ctx);
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

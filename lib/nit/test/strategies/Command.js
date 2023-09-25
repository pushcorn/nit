module.exports = function (nit)
{
    return nit.test.defineStrategy ("nit.test.strategies.Command")
        .require ("nit.Command")
        .field ("<command>", "command", "The command to test.")

        .property ("class", "function")
        .property ("object", "nit.Command")
        .property ("context", "nit.Command.Context")

        .onConstruct (function (command)
        {
            let cls = nit.lookupCommand (command);

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
            return await this.object.run (this.context);
        })
    ;
};

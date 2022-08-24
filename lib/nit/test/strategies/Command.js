module.exports = function (nit)
{
    return nit.test.defineStrategy ("nit.test.strategies.Command")
        .require ("nit.Command")
        .field ("<command>", "nit.Command.Type", "The command to test.")

        .property ("commandClass", "function")

        .construct (function (command)
        {
            let cls = command.lookup ();

            this.commandClass = cls;
            this.description = this.description || `Command: ${cls.name}`;
        })
        .test (function ()
        {
            return this.commandClass.run (...arguments);
        })
    ;
};

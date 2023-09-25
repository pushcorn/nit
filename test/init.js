module.exports = function (nit)
{
    nit.do (nit.listComponents, oldListComponents =>
    {
        const TestAdapter = nit.defineClass ("test.commandadapters.Test")
            .staticMethod ("registerCommands", function () {})
        ;

        nit.listComponents = function (category, returnNames)
        {
            if (category == "commandadapters")
            {
                return [{ class: TestAdapter }];
            }
            else
            {
                return oldListComponents (category, returnNames);
            }
        };
    });
};

module.exports = function (nit)
{
    return nit.defineClass ("nit.commandadapters.Task", "nit.CommandAdapter")
        .meta ({ category: "tasks" })
        .onBuildCommand ((Command, Task) =>
        {
            Command
                .describe (Task.description)
                .defineInput (Input =>
                {
                    Input.import (Task.fields);
                })
                .onRun (function ({ input })
                {
                    return Task (input.toPojo ()).execute ();
                })
            ;
        })
    ;
};

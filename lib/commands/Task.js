module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Task"))
        .describe ("Execute a task.")
        .defineSubcommand (Subcommand =>
        {
            Subcommand
                .onBuildSubcommand ((Subcommand, Task) =>
                {
                    Subcommand
                        .describe (Task.description)
                        .defineInput (Input =>
                        {
                            Input.import (Task.fields);
                        })
                    ;
                })
                .method ("execute", function ()
                {
                    return this.new ().execute ();
                })
            ;
        })
        .defineInput (Input => Input.option ("<task>", Self.Subcommand.name, "The task to run."))
        .onRun (ctx => ctx.input.task.execute ())
    ;
};

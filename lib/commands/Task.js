module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Task"))
        .require ("nit.Task")
        .describe ("Run a task.")
        .defineSubcommand (Subcommand =>
        {
            Subcommand
                .onBuildSubcommand ((Subcommand, Task) =>
                {
                    Subcommand
                        .describe (Task.description)
                        .defineInput (Input =>
                        {
                            Input.importProperties (Task.fields);
                        })
                    ;
                })
                .method ("run", async function (parent)
                {
                    return (await this.new ().run ({ parent })).result;
                })
            ;
        })
        .defineInput (Input => Input.option ("<task>", Self.Subcommand.name, "The task to run."))
        .onRun (ctx => ctx.input.task.run (ctx))
    ;
};

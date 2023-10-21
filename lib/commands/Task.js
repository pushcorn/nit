module.exports = function (nit)
{
    return nit.defineCommand ("commands.Task")
        .describe ("Execute a task.")
        .defineInput (Input => Input.option ("<task>", "nit.TaskSubcommand", "The task to run."))
        .onRun (ctx => ctx.input.task.execute ())
    ;
};

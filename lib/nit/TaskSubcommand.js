module.exports = function (nit)
{
    return nit.defineClass ("nit.TaskSubcommand", "nit.Subcommand")
        .forComponent ("nit.Task")
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
};

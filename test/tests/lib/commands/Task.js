test.command ("commands.Task")
    .should ("run the specified task")
        .project ("project-a", true)
        .given ("nit:say-hello", "there")
        .expectingPropertyToBe ("result", "Hello there!")
        .commit ()
;

test.method ("commands.Task.TaskSubcommand", "buildSubcommand", true)
    .should ("build the subcommand for the specified task")
        .project ("project-a", true)
        .before (s => s.args = ["nit.tasksubcommands.SayHello", new nit.ComponentDescriptor ("nit.tasks.SayHello", "tasks")])
        .expectingPropertyToBe ("result.Input.fields.length", 1)
        .expectingPropertyToBe ("result.Input.fieldMap.message.required", true)
        .commit ()
;


test.method ("commands.Task.TaskSubcommand", "run")
    .should ("create and run the task")
        .project ("project-a", true)
        .up (s => s.class = nit.require ("nit.tasksubcommands.SayHello"))
        .up (s => s.createArgs = { input: "John Doe" })
        .returns ("Hello John Doe!")
        .commit ()
;

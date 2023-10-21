test.method ("nit.TaskSubcommand", "buildSubcommand", true)
    .should ("build the subcommand for the specified task")
        .project ("project-a", true)
        .before (s => s.args = ["nit.tasksubcommands.SayHello", new nit.ComponentDescriptor ("nit.tasks.SayHello", "tasks")])
        .expectingPropertyToBe ("result.Input.fields.length", 1)
        .expectingPropertyToBe ("result.Input.fieldMap.message.required", true)
        .commit ()
;


test.method ("nit.TaskSubcommand", "execute")
    .should ("create and execute the task")
        .project ("project-a", true)
        .up (s => s.class = nit.require ("nit.tasksubcommands.SayHello"))
        .up (s => s.createArgs = { input: "John Doe" })
        .returns ("Hello John Doe!")
        .commit ()
;

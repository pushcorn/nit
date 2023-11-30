test.method ("tasks.Workflow.compgencompleters.Completer", "generate", true)
    .should ("list the workflow options")
        .project ("project-a")
        .given (
        {
            completionType: "option",
            commandClass: { name: "commands.Task" },
            currentOption: { name: "inputs" },
            specifiedValues: { task: "workflow", workflow: "nit:echo-test" },
            filterCompletions: v => v
        })
        .returns (["VALUE", "colorize="])
        .commit ()
;


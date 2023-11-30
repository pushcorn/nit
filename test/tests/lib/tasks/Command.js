test.method ("tasks.Command.compgencompleters.Completer", "generate", true)
    .should ("list the command options")
        .project ("project-a")
        .given (
        {
            completionType: "option",
            commandClass: { name: "commands.Task" },
            currentOption: { name: "options" },
            specifiedValues: { task: "command", command: "help" },
            filterCompletions: v => v
        })
        .returns (["VALUE", "command=", "subcommand="])
        .commit ()
;


test.method ("tasks.Command", "run")
    .should ("run the specifed command")
        .up (s => s.createArgs = ["help"])
        .expectingPropertyToBe ("result.result", /^Display[\s\S]*Usage/)
        .commit ()

    .should ("run the specifed subcommand")
        .project ("project-a")
        .up (s => s.createArgs = ["git", "gitcommand=pull", { subcommandOptions: ["repository=a.b.c"] }])
        .expectingPropertyToBe ("result.result", "pull completed from a.b.c")
        .commit ()
;

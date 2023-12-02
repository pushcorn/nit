test.method ("nit.Task.compgencompleters.Completer", "generate", true)
    .should ("generate the task names")
        .project ("project-a", true)
        .given (
        {
            completionType: "type",
            currentOption:
            {
                type: "task"
            }
            ,
            filterCompletions: t => t
        })
        .returns (["VALUE", "nit:do-something", "nit:say-hello"])
        .commit ()
;



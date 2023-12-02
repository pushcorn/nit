test.command ("commands.Shell")
    .should ("run a shell comand")
        .given ("nit:do-this", "param1")
        .mock ("class.Shell", "run", function ()
        {
            return { exitCode: 0, stdout: "OK" };
        })
        .expectingPropertyToBe ("result", "OK")
        .commit ()

    .should ("throw if the command did not return successfully")
        .given ("nit:not-found", "param1")
        .mock ("class.Shell", "run", function ()
        {
            return { exitCode: 1, stderr: "NOT FOUND!" };
        })
        .throws ("error.shell_error")
        .commit ()
;


test.method ("commands.Shell.compgencompleters.Completer", "generate", true)
    .should ("generate the available shell commands")
        .up (s => s.Shell = nit.lookupClass ("commands.Shell"))
        .mock ("Shell.Shell", "run", function ()
        {
            return { stdout: "ls\ngit" };
        })
        .given (
        {
            completionType: "option",
            commandClass: { name: "commands.Shell" },
            currentOption: { name: "command" },
            filterCompletions: (cs) => cs
        })
        .returns (["VALUE", "ls", "git"])
        .commit ()
;

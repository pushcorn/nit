nit.require ("nit.Command");


test.method ("nit.Subcommand", "help", true)
    .should ("return the help builder for the subcommand")
        .project ("project-a", true)
        .up (s => s.args = s.Cmd = nit.lookupCommand ("git"))
        .up (s => s.class = s.Cmd.Input.subcommandOption.class.lookup ("Push"))
        .returnsInstanceOf ("nit.utils.HelpBuilder")
        .expectingMethodToReturnValue ("result.build", null, nit.trim.text (`
        Update remote refs along with associated objects

        Usage: nit git [command-options...] push [repo] [log-level]

        Options:

         [repo]           The target repository.
         [log-level]      The log level.

         -a, --all        Push all commits.
        `))
        .commit ()

    .reset ()
        .project ("project-a", true)
        .up (s => s.args = s.Cmd)
        .up (s => s.class = s.Cmd.Input.subcommandOption.class.lookup ("Pull"))
        .returnsInstanceOf ("nit.utils.HelpBuilder")
        .expectingMethodToReturnValue ("result.build", null, nit.trim.text (`
        Fetch from and integrate with another repository or a local branch

        Usage: nit git [command-options...] pull

        Options:

         -a, --all
         -r, --repository
         -v, --verbose
        `))
        .commit ()

    .should ("not include the command options")
        .project ("project-a", true)
        .up (s => s.args = s.Cmd)
        .up (s => s.class = s.Cmd.Input.subcommandOption.class.lookup ("Push"))
        .up (s => s.Cmd.Input.nargs.splice (0))
        .returnsInstanceOf ("nit.utils.HelpBuilder")
        .expectingMethodToReturnValue ("result.build", null, nit.trim.text (`
        Update remote refs along with associated objects

        Usage: nit git push [repo] [log-level]

        Options:

         [repo]           The target repository.
         [log-level]      The log level.

         -a, --all        Push all commits.
        `))
        .commit ()

    .should ("not include the subcommand options section none available")
        .project ("project-a", true)
        .up (s => s.args = s.Cmd)
        .up (s => s.class = s.Cmd.Input.subcommandOption.class.lookup ("Pull"))
        .up (s => s.class.Input.nargs.splice (0))
        .returnsInstanceOf ("nit.utils.HelpBuilder")
        .expectingMethodToReturnValue ("result.build", null, nit.trim.text (`
        Fetch from and integrate with another repository or a local branch

        Usage: nit git pull
        `))
        .commit ()
;


test.method ("nit.Subcommand", "forComponent", true)
    .should ("set the category for the given component")
        .given ("test.Api")
        .expectingPropertyToBe ("class.category", "apis")
        .commit ()
;


test.method ("nit.Subcommand", "listBackingComponents", true)
    .should ("list the components that will be transformed to subcommands")
        .project ("project-a", true)
        .before (s => s.object = nit.require ("commands.Git.GitSubcommand"))
        .after (s =>
        {
            s.Pull = s.object.lookup ("pull");
            s.pull = new s.Pull ({ input: { all: true, repository: "my-repo" } });
            s.pullComponent = s.pull.component;
        })
        .returnsResultContaining (
        [
        {
            category: "gits",
            className: "gits.Pull",
            name: "pull"
        }
        ,
        {
            category: "gits",
            className: "gits.Push",
            name: "push"
        }
        ])
        .expectingPropertyToBe ("Pull.name", "gitsubcommands.Pull")
        .expectingPropertyToBe ("Pull.Input.fields.length", 3)
        .expectingPropertyToBe ("Pull.description", "Fetch from and integrate with another repository or a local branch")
        .expectingPropertyToBe ("pull.input", { all: true, repository: "my-repo", verbose: false })
        .expectingPropertyToBe ("pullComponent.name", "gits.Pull")
        .commit ()
;


test.method ("nit.Subcommand", "listSubcommands", true)
    .should ("list the subcommands")
        .project ("project-a", true)
        .before (s => s.object = nit.require ("commands.Git.GitSubcommand"))
        .returnsResultContaining (
        [
        {
            category: "gitsubcommands",
            className: "gitsubcommands.Pull",
            name: "pull"
        }
        ,
        {
            category: "gitsubcommands",
            className: "gitsubcommands.Push",
            name: "push"
        }
        ])
        .commit ()

    .should ("return the subcommand names if returnNames is true")
        .project ("project-a", true)
        .before (s => s.object = nit.require ("commands.Git.GitSubcommand"))
        .given (true)
        .returns (["pull", "push"])
        .commit ()
;


test.method ("nit.Subcommand", "new")
    .should ("create an instance of component that backs the subcommand")
        .project ("project-a", true)
        .before (s => s.object = nit.new ("gitsubcommands.Pull", { input: { verbose: true } }))
        .expectingPropertyToBe ("result.verbose", true)
        .expectingPropertyToBe ("result.all", false)
        .commit ()

    .reset ()
        .project ("project-a", true)
        .given ({ all: true, repository: "my-repo" })
        .before (s => s.object = nit.new ("gitsubcommands.Pull", { input: { verbose: true } }))
        .expectingPropertyToBe ("result.verbose", false)
        .expectingPropertyToBe ("result.all", true)
        .expectingPropertyToBe ("result.repository", "my-repo")
        .commit ()

    .reset ()
        .project ("project-a", true)
        .before (s => s.object = nit.new ("gitsubcommands.Pull"))
        .expectingPropertyToBe ("result.verbose", false)
        .expectingPropertyToBe ("result.all", false)
        .expectingPropertyToBe ("result.repository", "")
        .commit ()
;


test.custom ("Method: nit.Subcommand.compgencompleters.Completer.generate ()")
    .should ("return the completions for the subcommand")
        .project ("project-a", true)
        .before (s => s.object = nit.require ("commands.Git.GitSubcommand"))
        .before (s => s.GitCommand = nit.require ("commands.Git"))
        .before (s => s.Completer = nit.lookupClass ("commands.Git.GitSubcommand.compgencompleters.Completer"))
        .task (s => s.Completer.generate (nit.new ("nit.Compgen.Context",
        {
            currentOption: s.GitCommand.Input.fieldMap.gitcommand,
            completionType: "type"
        })))
        .returns (["SUBCOMMAND", "pull", "push"])
        .commit ()

    .should ("return undefined if the option type is not the specified subcommand")
        .project ("project-a", true)
        .task (s => s.Completer.generate (nit.new ("nit.Compgen.Context",
        {
            currentOption: s.GitCommand.Input.fieldMap.auth,
            completionType: "type"
        })))
        .returns ()
        .commit ()
;

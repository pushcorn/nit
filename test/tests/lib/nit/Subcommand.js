test.custom ("nit.Subcommand.autoRegister")
    .should ("not register the subcommands if set to false")
        .project ("project-a")
        .init (s =>
        {
            s.Subcommand = nit.require ("nit.Subcommand");
            s.Subcommand.autoRegister = false;
        })
        .mock ("Subcommand", "registerSubcommands")
        .task (s => s.GitSubcommand = nit.require ("nit.GitSubcommand"))
        .after (s =>
        {
            s.Subcommand.autoRegister = true;
            nit.resetRequireCache ();
        })
        .expectingPropertyToBe ("mocks.0.invocations.length", 0)
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
        .project ("project-a")
        .before (s => s.object = nit.require ("nit.GitSubcommand"))
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
        .project ("project-a")
        .before (s => s.object = nit.require ("nit.GitSubcommand"))
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
        .project ("project-a")
        .before (s => s.object = nit.require ("nit.GitSubcommand"))
        .given (true)
        .returns (["pull", "push"])
        .commit ()
;


test.method ("nit.Subcommand", "new")
    .should ("create an instance of component that backs the subcommand")
        .project ("project-a")
        .before (() => nit.require ("nit.GitSubcommand"))
        .before (s => s.object = nit.new ("gitsubcommands.Pull", { input: { verbose: true } }))
        .expectingPropertyToBe ("result.verbose", true)
        .expectingPropertyToBe ("result.all", false)
        .commit ()

    .reset ()
        .project ("project-a")
        .given ({ all: true, repository: "my-repo" })
        .before (() => nit.require ("nit.GitSubcommand"))
        .before (s => s.object = nit.new ("gitsubcommands.Pull", { input: { verbose: true } }))
        .expectingPropertyToBe ("result.verbose", false)
        .expectingPropertyToBe ("result.all", true)
        .expectingPropertyToBe ("result.repository", "my-repo")
        .commit ()
;


test.custom ("Method: nit.Subcommand.compgencompleters.Completer.generate ()")
    .should ("return the completions for the subcommand")
        .project ("project-a")
        .before (s => s.GitSubcommand = nit.require ("nit.GitSubcommand"))
        .before (s => s.GitCommand = nit.require ("commands.Git"))
        .before (s => s.Completer = nit.lookupClass ("nit.GitSubcommand.compgencompleters.Completer"))
        .task (s => s.Completer.generate (nit.new ("nit.Compgen.Context",
        {
            currentOption: s.GitCommand.Input.fieldMap.gitcommand,
            completionType: "type"
        })))
        .returns (["VALUE", "pull", "push"])
        .commit ()

    .should ("return undefined if the option type is not the specified subcommand")
        .project ("project-a")
        .task (s => s.Completer.generate (nit.new ("nit.Compgen.Context",
        {
            currentOption: s.GitCommand.Input.fieldMap.auth,
            completionType: "type"
        })))
        .returns ()
        .commit ()
;

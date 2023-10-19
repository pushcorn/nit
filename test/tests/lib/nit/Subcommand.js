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


test.method ("nit.Subcommand.Completer", "completeForType", true)
    .should ("return the completions for the subcommand")
        .project ("project-a")
        .before (s => s.GitSubcommand = nit.require ("nit.GitSubcommand"))
        .before (s => s.GitCommand = nit.require ("commands.Git"))
        .before (s => s.object = s.GitSubcommand.completers.Subcommand)
        .before (s => s.args = nit.new ("nit.Compgen.Context",
        {
            currentOption: s.GitCommand.Input.fieldMap.gitcommand
        }))
        .returns (["VALUE", "pull", "push"])
        .commit ()

    .should ("return undefined if the option type is not the specified subcommand")
        .project ("project-a")
        .before (s => s.object = s.GitSubcommand.completers.Subcommand)
        .before (s => s.args = nit.new ("nit.Compgen.Context",
        {
            currentOption: s.GitCommand.Input.fieldMap.auth
        }))
        .returns ()
        .commit ()
;

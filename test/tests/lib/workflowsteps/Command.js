nit.require ("nit.Workflow");


test.method ("workflowsteps.Command", "run")
    .should ("run a nit command")
        .project ("project-a", true)
        .up (s => s.createArgs = "test-cmd")
        .expectingPropertyToBe ("result.output", "This is the test command.")
        .commit ()

    .should ("run a nit command with a subcommand")
        .project ("project-a", true)
        .up (s => s.createArgs =
        [
            "git",
            {
                subcommand:
                {
                    name: "pull",
                    options:
                    {
                        verbose: true
                    }
                }
            }
        ])
        .expectingPropertyToBe ("result.output", "pull completed")
        .commit ()
;

nit.require ("nit.Workflow");


test.command ("commands.Workflow")
    .should ("run a workflow found in the class path")
        .project ("project-a", true)
        .given ("nit:echo-test", { colorize: true })
        .mock (nit, "log")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "test 1")
        .expectingPropertyToBe ("mocks.0.invocations.1.args.0", /^\d{4}.*test 2 true$/)
        .commit ()

    .should ("be able to run an arbitrary workflow file")
        .given (nit.path.join (test.TEST_PROJECT_PATH, "resources/home/workflows/random.json"))
        .expectingPropertyToBe ("result", /^\d\.\d+$/)
        .commit ()
;


test.method ("commands.Workflow.WorkflowSubcommand", "lookup", true)
    .should ("throw if the workflow file was not found")
        .given (nit.path.join (test.TEST_PROJECT_PATH, "resources/home/workflows/random2.json"))
        .throws ("error.workflow_not_found")
        .commit ()
;

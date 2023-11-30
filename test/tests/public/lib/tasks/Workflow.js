test.method ("tasks.Workflow", "run")
    .should ("run the specifed workflow")
        .project ("project-a")
        .up (s => s.createArgs = ["nit:echo-test"])
        .mock (nit.log, "logger")
        .expectingPropertyToBe ("mocks.0.invocations.length", 2)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "test 1")
        .commit ()
;

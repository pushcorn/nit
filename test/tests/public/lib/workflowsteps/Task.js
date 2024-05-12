nit.requireAll ("nit.Workflow", "nit.Task");


test.method ("workflowsteps.Task", "run")
    .should ("run the specified task")
        .project ("project-a", true)
        .up (s => s.createArgs = ["nit:say-hello"])
        .given ({ input: "there" })
        .expectingPropertyToBe ("result.output", "Hello there!")
        .commit ()
;

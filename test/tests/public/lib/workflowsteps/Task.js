/* eslint-disable  no-template-curly-in-string */

nit.requireAll ("nit.Workflow", "nit.Task");


test.method ("workflowsteps.Task", "run")
    .should ("run the specified task")
        .project ("project-a")
        .up (s => s.createArgs = ["nit:say-hello"])
        .given ({ input: "there" })
        .expectingPropertyToBe ("result.output", "Hello there!")
        .commit ()
;

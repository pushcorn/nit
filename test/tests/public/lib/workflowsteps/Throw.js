nit.requireAll ("nit.Workflow");


test.method ("workflowsteps.Throw", "run")
    .should ("throw an exception")
        .up (s => s.createArgs = ["Invalid value!", "error.invalid_value"])
        .throws ("error.invalid_value")
        .expectingPropertyToBe ("error.message", "Invalid value!")
        .commit ()
;

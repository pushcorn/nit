nit.require ("nit.Workflow");


test.method ("workflowsteps.Return", "run")
    .should ("return the return control")
        .up (s => s.createArgs = "no res")
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBeOfType ("result.output", "nit.Workflow.Return")
        .expectingPropertyToBe ("result.output.value", "no res")
        .commit ()

    .reset ()
        .given ({ input: 1234 })
        .expectingPropertyToBe ("result.output.value", 1234)
        .commit ()
;

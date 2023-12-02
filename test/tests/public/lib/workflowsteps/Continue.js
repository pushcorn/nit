nit.require ("nit.Workflow");


test.method ("workflowsteps.Continue", "run")
    .should ("return the continue control")
    .returnsInstanceOf ("workflowsteps.Continue.Context")
    .expectingPropertyToBeOfType ("result.output", "nit.Workflow.Continue")
    .commit ()
;

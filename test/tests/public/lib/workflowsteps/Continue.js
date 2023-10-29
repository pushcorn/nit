nit.require ("nit.Workflow");


test.method ("workflowsteps.Continue", "run")
    .should ("return the continue control")
    .returnsInstanceOf ("nit.Workflow.Subcontext")
    .expectingPropertyToBeOfType ("result.output", "nit.Workflow.Continue")
    .commit ()
;

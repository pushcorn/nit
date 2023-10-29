nit.require ("nit.Workflow");


test.method ("workflowsteps.Break", "run")
    .should ("return the break control")
    .returnsInstanceOf ("nit.Workflow.Subcontext")
    .expectingPropertyToBeOfType ("result.output", "nit.Workflow.Break")
    .commit ()
;

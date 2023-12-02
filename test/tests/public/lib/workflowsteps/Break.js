nit.require ("nit.Workflow");


test.method ("workflowsteps.Break", "run")
    .should ("return the break control")
    .returnsInstanceOf ("workflowsteps.Break.Context")
    .expectingPropertyToBeOfType ("result.output", "nit.Workflow.Break")
    .commit ()
;

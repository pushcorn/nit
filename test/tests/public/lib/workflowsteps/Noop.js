nit.require ("nit.Workflow");


test.method ("workflowsteps.Noop", "run")
    .should ("do nothing")
    .returnsInstanceOf ("workflowsteps.Noop.Context")
    .commit ()
;

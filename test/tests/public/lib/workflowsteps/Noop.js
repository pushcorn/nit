/* eslint-disable  no-template-curly-in-string */

nit.require ("nit.Workflow");


test.method ("workflowsteps.Noop", "run")
    .should ("do nothing")
    .returnsInstanceOf ("nit.Workflow.Subcontext")
    .commit ()
;

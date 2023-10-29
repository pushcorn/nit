/* eslint-disable  no-template-curly-in-string */

nit.require ("nit.Workflow");


test.method ("workflowsteps.Assign", "run")
    .should ("assign a value to a context property")
        .up (s => s.createArgs = ["k", "v"])
        .expectingPropertyToBe ("result.k", "v")
        .commit ()

    .reset ()
        .up (s => s.createArgs = ["root.k", "${ root.k + 'v' }"])
        .given (nit.Workflow.Context.new ({ k: "v" }))
        .expectingPropertyToBe ("result.root.k", "vv")
        .commit ()

    .should ("support appending a value")
        .up (s => s.createArgs = ["k", "w", "append"])
        .given ({ k: "v" })
        .expectingPropertyToBe ("result.k", ["v", "w"])
        .commit ()

    .should ("support prepending a value")
        .up (s => s.createArgs = ["k", "w", "prepend"])
        .given ({ k: "v" })
        .expectingPropertyToBe ("result.k", ["w", "v"])
        .commit ()
;

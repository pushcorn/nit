/* eslint-disable  no-template-curly-in-string */


test.custom ("Method: nit.WorkflowField.set ()")
    .should ("create the evaluator object if expr is allowed")
        .up (s => s.MyClass = nit.defineClass ("MyClass"))
        .up (s => s.object = new s.MyClass)
        .up (s => s.field = nit.new ("nit.WorkflowField", "diff", "integer", { exprAllowed: true }))
        .up (s => s.field.bind (s.object))
        .task (s => s.object.diff = "${ a - b }")
        .expectingPropertyToBeOfType ("object.$__diff\\.nit\\.WorkflowField\\.evaluator", nit.lookupClass ("nit.Workflow.Evaluator"))
        .commit ()

    .should ("NOT create the evaluator object if expr is NOT allowed")
        .up (s => s.MyClass = nit.defineClass ("MyClass"))
        .up (s => s.object = new s.MyClass)
        .up (s => s.field = nit.new ("nit.WorkflowField", "diff", "integer"))
        .up (s => s.field.bind (s.object))
        .task (s => s.object.diff = 9)
        .expectingPropertyToBe ("object.$__diff\\.nit\\.WorkflowField\\.evaluator", undefined)
        .commit ()
;


test.method ("nit.WorkflowField", "evaluate")
    .should ("evaluate the field's value to a real value")
        .up (s => s.createArgs = ["diff", "integer", { exprAllowed: true }])
        .up (s => s.MyClass = nit.defineClass ("MyClass"))
        .up (s => s.owner = new s.MyClass)
        .before (s => s.object.set.call (s.owner, "${ a - b }"))
        .before (s => s.args = [s.owner, { a: 3, b: 4 }])
        .returns (-1)
        .commit ()

    .should ("throw if evaluation failed")
        .up (s => s.createArgs = ["diff", "integer", { exprAllowed: true }])
        .before (s => s.object.set.call (s.owner, "${ a new b }"))
        .before (s => s.args = [s.owner])
        .throws ("error.invalid_expression")
        .commit ()

    .should ("do nothing if the evaluator was not set")
        .up (s => s.createArgs = ["diff", "integer"])
        .up (s => s.owner = new s.MyClass)
        .before (s => s.args = [s.owner])
        .returns ()
        .commit ()

    .should ("create a default evaluator if the defval is an expression")
        .up (s => s.createArgs = ["diff", "integer", "a diff value", "${ a - b }"])
        .up (s => s.owner = new s.MyClass)
        .before (s => s.object.bind (s.owner))
        .before (s => s.args = [s.owner, { a: 5, b: 7 }])
        .returns (-2)
        .commit ()

    .should ("not create a default evaluator if the defval is NOT an expression")
        .up (s => s.createArgs = ["diff", "integer", "a diff value", 20])
        .up (s => s.owner = new s.MyClass)
        .before (s => s.object.bind (s.owner))
        .before (s => s.args = [s.owner, { a: 5, b: 7 }])
        .returns (20)
        .commit ()
;

/* eslint-disable  no-template-curly-in-string */


test.object ("nit.WorkflowField")
    .should ("update the string defval to an evaluation function if expr is allowed")
        .given ("diff", "integer", "The diff between two numbers.", "${ a - b }", { exprAllowed: true })
        .expectingPropertyToBeOfType ("result.defval", "function")
        .expectingExprToReturnValue ("result.defval (result, {})", 0)
        .commit ()
;


test.method ("nit.WorkflowField", "set")
    .should ("create the evaluator object if expr is allowed")
        .up (s => s.createArgs = ["diff", "integer", { exprAllowed: true }])
        .given ("${ a - b }")
        .expectingPropertyToBeOfType ("object.$__diff\\.nit\\.WorkflowField\\.evaluator", nit.lookupClass ("nit.Workflow.Evaluator"))
        .commit ()

    .should ("NOT create the evaluator object if expr is NOT allowed")
        .up (s => s.createArgs = ["diff", "integer"])
        .given (9)
        .expectingPropertyToBe ("object.$__diff\\.nit\\.WorkflowField\\.evaluator", undefined)
        .commit ()
;


test.method ("nit.WorkflowField", "evaluate")
    .should ("set the field value to the evaluator's evaluation result")
        .up (s => s.createArgs = ["diff", "integer", { exprAllowed: true }])
        .up (s => s.MyClass = nit.defineClass ("MyClass"))
        .up (s => s.owner = new s.MyClass)
        .before (s => s.object.set.call (s.owner, "${ a - b }"))
        .before (s => s.args = [s.owner, { a: 3, b: 4 }])
        .expectingPropertyToBe ("owner.$__diff", -1)
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

;

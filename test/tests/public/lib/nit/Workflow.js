/* eslint-disable  no-template-curly-in-string */


nit.test.Strategy
    .memo ("Workflow", () => nit.require ("nit.Workflow"))
    .memo ("WorkflowStep", () => nit.require ("nit.WorkflowStep"))
;


test.method ("nit.Workflow.Evaluator", "create", true)
    .should ("return undefined if the expression is undefined")
        .given ()
        .returns ()
        .commit ()

    .should ("return a string evaluator if the expression is a string")
        .given ("abcd")
        .returnsInstanceOf ("nit.Workflow.evaluators.String")
        .expectingMethodToReturnValue ("result.evaluate", null, "abcd")
        .commit ()

    .should ("return an object evaluator if the expression is an object")
        .given ({ degree: "${ base * 3 }" })
        .returnsInstanceOf ("nit.Workflow.evaluators.Object")
        .expectingMethodToReturnValue ("result.evaluate", { base: 10 }, { degree: 30 })
        .commit ()

    .should ("return an array evaluator if the expression is an array")
        .given ([{ degree1: "${ base * 3 }" }, { degree2: "${ base / 2}" }])
        .returnsInstanceOf ("nit.Workflow.evaluators.Array")
        .expectingMethodToReturnValue ("result.evaluate", { base: 10 }, [{ degree1: 30 }, { degree2: 5 }])
        .commit ()

    .should ("return an identity evaluator if the expression other defined value")
        .given (9)
        .returnsInstanceOf ("nit.Workflow.evaluators.Identity")
        .expectingMethodToReturnValue ("result.evaluate", { base: 10 }, 9)
        .commit ()
;


test.method ("nit.Workflow.Evaluator", "evaluate")
    .should ("throw invalid_expression error if the evaluation failed")
        .up (s => s.class = s.class.defineSubclass ("MyEval")
            .onEvaluate (function ()
            {
                throw new Error ("FAILED");
            })
        )
        .throws ("error.invalid_expression")
        .expectingPropertyToBe ("error.message", /unable to evaluate.*Cause.*FAILED/i)
        .commit ()
;


test.method ("nit.Workflow.Input", "defineRuntimeClass", true)
    .should ("define a runtime input class for the given options")
        .up (s => s.args =
        [
            nit.new ("nit.Workflow.Option", "<firstname>"),
            nit.new ("nit.Workflow.Option", "<lastname>")
        ])
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "nit.Workflow.Input")
        .expectingPropertyToBe ("result.fields.length", 2)
        .expectingPropertyToBe ("result.fields.0.name", "firstname")
        .expectingPropertyToBe ("result.fields.1.name", "lastname")
        .commit ()
;


test.method ("nit.Workflow.Context", "defineRuntimeClass", true)
    .should ("define a runtime context class")
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "nit.Workflow.Context")
        .expecting ("Context.$ to return the global object", s => s.result ().$ == global)
        .commit ()
;


test.method ("nit.Workflow.Subroutine.Context", "defineRuntimeClass", true)
    .should ("define a runtime context class for a subrouting")
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "nit.Workflow.Subroutine.Context")
        .commit ()
;


test.object ("nit.Workflow.Subroutine", true, "inputClass")
    .should ("return a runtime input class for the subroutine")
        .given ("my-test", "break")
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "nit.Workflow.Subroutine.Input")
        .expectingPropertyToBe ("instance.steps.length", 1)
        .commit ()
;


test.object ("nit.Workflow.Subroutine", true, "contextClass")
    .should ("return the runtime context class with an input field for the subroutine")
        .given ("my-test", "break",
        {
            options:
            [
            {
                spec: "<firstname>"
            }
            ,
            {
                spec: "<lastname>"
            }
            ]
        })
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "nit.Workflow.Subroutine.Context")
        .expectingPropertyToBe ("result.fieldMap.input.class.name", "nit.Workflow.Subroutine.Input")
        .expectingPropertyToBe ("result.fieldMap.input.class.fields.length", 2)
        .expectingPropertyToBe ("result.fieldMap.input.class.fields.0.name", "firstname")
        .expectingExprToReturnValueOfType ("nit.new (result)", "nit.Workflow.Subroutine.Context")
        .commit ()
;


test.method ("nit.Workflow.Subroutine", "run")
    .should ("run with the caller's scope by default")
        .up (s => s.AddOne = s.WorkflowStep.defineSubclass ("AddOne")
            .onRun (ctx => ctx.caller.value += 1)
        )
        .up (s => s.MultiplyByTwo = s.WorkflowStep.defineSubclass ("MultiplyByTwo")
            .onRun (ctx => ctx.caller.value *= 2)
        )
        .up (s => s.createArgs = ["my-sub", "AddOne", "MultiplyByTwo"])
        .given ({ value: 5, scope: { id: 99 } })
        .returnsInstanceOf ("nit.Workflow.Subroutine.Context")
        .expectingPropertyToBe ("result.caller.value", 12)
        .expectingPropertyToBe ("result.output", 12)
        .expectingPropertyToBe ("result.scope.id", 99)
        .commit ()

    .should ("run with a new scope if inheritScope is false")
        .up (s => s.createArgs = ["my-sub", "AddOne", "MultiplyByTwo", { inheritScope: false }])
        .given ({ value: 5, scope: { id: 99 } })
        .returnsInstanceOf ("nit.Workflow.Subroutine.Context")
        .expectingPropertyToBe ("result.caller.value", 12)
        .expectingPropertyToBe ("result.output", 12)
        .expectingPropertyToBe ("result.scope.id", undefined)
        .commit ()

    .should ("use provided workflow context")
        .up (s => s.createArgs = ["my-sub", "AddOne", "MultiplyByTwo"])
        .up (s => s.workflow = new s.Workflow ("run subs", { globalSource: "nit" }))
        .up (s => s.args = s.workflow.contextClass.new ({ value: 5, scope: { id: 99 } }))
        .returnsInstanceOf ("nit.Workflow.Subroutine.Context")
        .expectingPropertyToBe ("result.caller.value", 12)
        .expectingPropertyToBe ("result.output", 12)
        .expectingPropertyToBe ("result.scope.id", 99)
        .expecting ("$ is nit", s => s.result.$ == nit)
        .commit ()
;


test.object ("nit.Workflow", true, "inputClass")
    .should ("return a runtime input class for the workflow")
        .given ("do something...")
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "nit.Workflow.Input")
        .expectingPropertyToBe ("instance.steps.length", 0)
        .commit ()

    .should ("add the specified option constraints")
        .given ("do something...",
        {
            options:
            [
            {
                spec: "<speed>",
                constraints:
                {
                    name: "choice",
                    options:
                    {
                        choices: ["low", "medium", "high"]
                    }
                }
            }
            ]
        })
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "nit.Workflow.Input")
        .expectingPropertyToBe ("result.fields.length", 1)
        .expectingPropertyToBe ("result.fields.0.constraints.length", 1)
        .expectingExprToThrow ("result.validate (result ('slow'))", /invalid value.*slow/)
        .expectingPropertyToBe ("instance.steps.length", 0)
        .commit ()
;


test.object ("nit.Workflow", true, "contextClass")
    .should ("return a runtime context class for the workflow")
        .given ("do that",
        {
            options:
            [
                { spec: "<firstname>" },
                { spec: "<lastname>" }
            ]
        })
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "nit.Workflow.Context")
        .expectingPropertyToBe ("result.fieldMap.input.class.name", "nit.Workflow.Input")
        .expectingPropertyToBe ("result.fieldMap.input.class.fields.length", 2)
        .expectingPropertyToBe ("result.fieldMap.input.class.fields.0.name", "firstname")
        .expectingExprToReturnValueOfType ("nit.new (result)", "nit.Workflow.Context")
        .commit ()
;


test.object ("nit.Workflow", true, "subroutineMap")
    .should ("return an index object for the subroutines")
        .given ("do that",
        {
            subroutines:
            [
                { name: "sub1", steps: "break" },
                { name: "sub 2", steps: "break" }
            ]
        })
        .returnsInstanceOf (Object)
        .expectingPropertyToBeOfType ("result.sub1", "nit.Workflow.Subroutine")
        .expectingPropertyToBeOfType ("result.sub 2", "nit.Workflow.Subroutine")
        .expectingMethodToThrow ("instance.lookupSubroutine", "sub3", "error.subroutine_not_defined")
        .expectingMethodToReturnValueOfType ("instance.lookupSubroutine", "sub1", "nit.Workflow.Subroutine")
        .commit ()
;


test.method ("nit.Workflow", "run")
    .should ("run with steps")
        .up (s => s.AddOne = s.WorkflowStep.defineSubclass ("AddOne")
            .onRun (ctx => ctx.value += 1)
        )
        .up (s => s.MultiplyByTwo = s.WorkflowStep.defineSubclass ("MultiplyByTwo")
            .onRun (ctx => ctx.value *= 2)
        )
        .up (s => s.createArgs = ["do math", "AddOne", "MultiplyByTwo"])
        .given ({ value: 5 })
        .returnsInstanceOf ("nit.Workflow.Context")
        .expectingPropertyToBe ("result.output", 12)
        .commit ()

    .should ("run the error handler if specified")
        .up (s => s.AddOne = s.WorkflowStep.defineSubclass ("AddOne")
            .onRun (() =>
            {
                throw new Error ("can't add");
            })
        )
        .up (s => s.MultiplyByTwo = s.WorkflowStep.defineSubclass ("MultiplyByTwo")
            .onRun (ctx => ctx.value *= 2)
        )
        .up (s => s.HandleError = s.WorkflowStep.defineSubclass ("HandleError")
            .onRun (ctx =>
            {
                nit.error.updateMessage (ctx.error, "but caught the error");
            })
        )
        .up (s => s.createArgs = ["do math", "AddOne", "MultiplyByTwo", { catch: "HandleError", globalSource: "nit" }])
        .given ({ value: 5 })
        .returnsInstanceOf ("nit.Workflow.Context")
        .expectingPropertyToBe ("result.output", undefined)
        .expectingPropertyToBe ("result.error.message", "but caught the error")
        .expecting ("the global source is nit", s => s.result.$ == nit)
        .commit ()

    .should ("rethrow the error if no catch step is specified")
        .up (s => s.createArgs = ["do math", "AddOne", "MultiplyByTwo"])
        .given ({ value: 5 })
        .throws ("can't add")
        .expectingPropertyToBeOfType ("error.nit\\.Workflow\\.context", "nit.Workflow.Context")
        .commit ()
;

/* eslint-disable  no-template-curly-in-string */

nit.resetRequireCache (/^nit\.Workflow/);
nit.requireAsset ("public/lib/nit/Workflow");


test.method ("nit.Workflow", "isExpr", true)
    .should ("return true if the expr is an expression: %{args.0}")
        .given ("${input}")
        .given (["${input}"])
        .given ({ a: "${input}" })
        .given ({ a: { b: "${input}" }, c: 1 })
        .returns (true)
        .commit ()

    .should ("return false if the expr is NOT an expression: %{args.0}")
        .given (9)
        .given ("")
        .given ({})
        .given ([3, 4])
        .given ({ a: 5 })
        .given ({ a: { b: 6 }, c: 1 })
        .returns (false)
        .commit ()
;


test.method ("nit.Workflow", "config", true)
    .should ("set the config for the workflow class")
        .up (s => s.class = nit.defineWorkflow ("test.workflows.MyFlow"))
        .given ({ vars: { v1: 1 } })
        .returnsInstanceOf ("nit.Workflow", true)
        .expecting ("the workflow description is provided if not provided", () => nit.new ("test.workflows.MyFlow").description == "My Flow")
        .expectingMethodToReturnValue ("result.config", null, { vars: { v1: 1 } })
        .commit ()
;


test.method ("nit.Workflow", "isControl", true)
    .should ("return true if the argument is an instance of flow control object")
        .up (s => s.args = nit.Workflow.CONTROLS.Break)
        .returns (true)
        .commit ()

    .should ("return false if the argument is NOT an instance of flow control object")
        .up (s => s.args = nit.Workflow.Break)
        .returns (false)
        .commit ()
;


test.method ("nit.Workflow.Evaluator", "create", true)
    .should ("return an identity evaluator if the expression is empty: %{args.0|format}")
        .given ("")
        .given ()
        .given ({})
        .returnsInstanceOf ("nit.Workflow.evaluators.Identity")
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


test.method ("nit.Workflow.Context", "new", true)
    .should ("create an instance of context")
        .given ({ input: 3, custom: { a: 1 } })
        .returnsInstanceOf ("nit.Workflow.Context")
        .expectingPropertyToBe ("result.input", 3)
        .expectingPropertyToBe ("result.custom",{ a: 1 })
        .commit ()
;


test.method ("nit.Workflow.Context", "defineRuntimeClass", true)
    .should ("define a runtime context class")
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "nit.Workflow.Context")
        .expecting ("Context.$ to return the global object", s => (s.ctx = s.result ()).$ == global)
        .expecting ("root is self", s => s.ctx == s.ctx.root)
        .commit ()
;


test.method ("nit.Workflow.Context", "cancel")
    .should ("cancel current workflow")
        .before (s => s.object.on ("cancel", function () { s.cancelCalled = true; }))
        .returnsInstanceOf ("nit.Workflow.Context")
        .expectingPropertyToBe ("result.canceled", true)
        .expectingPropertyToBe ("cancelCalled", true)
        .commit ()
;


test.method ("nit.Workflow.Context", "uncancel")
    .should ("reset the cancel status")
        .before (s => s.object.cancel ("test"))
        .returnsInstanceOf ("nit.Workflow.Context")
        .expectingPropertyToBe ("result.canceled", false)
        .expectingPropertyToBe ("result.cancelReason", undefined)
        .commit ()
;


test.method ("nit.Workflow.Subcontext", "new", true)
    .should ("create an instance of subcontext")
        .up (s => s.args = [new nit.Workflow.Context, { input: 3, custom: { a: 1 } }])
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .after (s => s.parent = s.result.parent)
        .after (s => s.result.parent = null)
        .expectingPropertyToBe ("result.input", 3)
        .expectingPropertyToBe ("result.custom",{ a: 1 })
        .expectingPropertyToBe ("parent.listeners.nit\\.Context\\.cancel.length", 0)
        .commit ()

    .should ("create a default parent context if not provided")
        .given ({ input: 3, custom: { a: 1 } })
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("result.input", 3)
        .expectingPropertyToBe ("result.custom",{ a: 1 })
        .expectingPropertyToBeOfType ("result.parent", "nit.Workflow.Context")
        .commit ()

    .should ("use parent's output as input")
        .given ({ custom: { a: 1 } })
        .after (s => s.result.parent = new nit.Workflow.Context ({ input: 20 }))
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("result.input", 20)
        .expectingPropertyToBe ("result.custom",{ a: 1 })
        .expectingPropertyToBeOfType ("result.parent", "nit.Workflow.Context")
        .commit ()
;


test.method ("nit.Workflow.Subcontext", "defineRuntimeClass", true)
    .should ("define a runtime subcontext class")
        .up (s => s.parent = nit.Workflow.Context.new ({ data: { a: 1 } }))
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("result.name", "nit.Workflow.Subcontext")
        .expecting ("Context.$ to return the global object", s => (s.subcontext = s.result (s.parent)).$ == global)
        .expectingPropertyToBe ("subcontext.root.data", { a: 1 })
        .expecting ("sub context's root is the parent context", s => s.subcontext.root == s.parent)
        .commit ()
;


test.method ("nit.Workflow.Subcontext", "cancel")
    .should ("cancel current subcontext")
        .up (s => s.parent = new nit.Workflow.Context)
        .up (s => s.parent.on ("cancel", () => s.parentCanceled = true))
        .up (s => s.createArgs = s.parent)
        .before (s => s.object.on ("cancel", function () { s.cancelCalled = true; }))
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("result.canceled", true)
        .expectingPropertyToBe ("parentCanceled", undefined)
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
        .expectingPropertyToBe ("result.name", "nit.Workflow.Subcontext")
        .expectingPropertyToBe ("result.fieldMap.input.class.name", "nit.Workflow.Subroutine.Input")
        .expectingPropertyToBe ("result.fieldMap.input.class.fields.length", 2)
        .expectingPropertyToBe ("result.fieldMap.input.class.fields.0.name", "firstname")
        .commit ()
;


test.method ("nit.Workflow.Subroutine", "run")
    .should ("run new parent context by default")
        .up (s => s.AddOne = nit.WorkflowStep.defineSubclass ("AddOne")
            .onRun (ctx =>
            {
                ctx.scope.id += 20;

                return ctx.value += 1;
            })
        )
        .up (s => s.MultiplyByTwo = nit.WorkflowStep.defineSubclass ("MultiplyByTwo")
            .onRun (ctx => ctx.value *= 2)
        )
        .up (s => s.createArgs = ["my-sub", "AddOne", "MultiplyByTwo", { vars: { va: 10 } }])
        .given ({ value: 5, scope: { id: 99 } })
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("result.value", 12)
        .expectingPropertyToBe ("result.output", 12)
        .expectingPropertyToBe ("result.scope.id", 119)
        .expectingPropertyToBe ("result.va", 10)
        .commit ()

    .should ("use provided subcontext")
        .up (s => s.AddOne = nit.WorkflowStep.defineSubclass ("AddOne")
            .onRun (ctx =>
            {
                ctx.scope.id += 20;

                return ctx.value += 1;
            })
        )
        .up (s => s.MultiplyByTwo = nit.WorkflowStep.defineSubclass ("MultiplyByTwo")
            .onRun (ctx => ctx.value *= 2)
        )
        .up (s => s.createArgs = ["my-sub", "AddOne", "MultiplyByTwo"])
        .up (s => s.workflow = new nit.Workflow ("run subs", { globalSource: "nit" }))
        .up (s => s.parent = s.workflow.contextClass.new ({ workflow: s.workflow }))
        .up (s => s.args = nit.Workflow.Subcontext.new ({ parent: s.parent, value: 5, scope: { id: 99 } }))
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("result.value", 12)
        .expectingPropertyToBe ("result.output", 12)
        .expectingPropertyToBe ("result.scope.id", 119)
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
        .up (s => s.AddOne = nit.WorkflowStep.defineSubclass ("AddOne")
            .onRun (ctx => ctx.value += 1)
        )
        .up (s => s.MultiplyByTwo = nit.WorkflowStep.defineSubclass ("MultiplyByTwo")
            .onRun (ctx => ctx.value *= 2)
        )
        .up (s => s.createArgs = ["do math", "AddOne", "MultiplyByTwo", { vars: { vw: 100 } }])
        .given ({ value: 5 })
        .returnsInstanceOf ("nit.Workflow.Context")
        .expectingPropertyToBe ("result.output", 12)
        .expectingPropertyToBe ("result.vw", 100)
        .commit ()

    .should ("run the error handler if specified")
        .up (s => s.AddOne = nit.WorkflowStep.defineSubclass ("AddOne")
            .onRun (() =>
            {
                throw new Error ("can't add");
            })
        )
        .up (s => s.MultiplyByTwo = nit.WorkflowStep.defineSubclass ("MultiplyByTwo")
            .onRun (ctx => ctx.value *= 2)
        )
        .up (s => s.HandleError = nit.WorkflowStep.defineSubclass ("HandleError")
            .onRun (ctx =>
            {
                nit.error.updateMessage (ctx.parent.error, "but caught the error");
            })
        )
        .up (s => s.createArgs = [{ steps: ["AddOne", "MultiplyByTwo"], catch: "HandleError", globalSource: "nit" }])
        .given ({ value: 5 })
        .returnsInstanceOf ("nit.Workflow.Context")
        .expectingPropertyToBeOfType ("result.output", "nit.Workflow.Input")
        .expectingPropertyToBe ("result.error.message", "but caught the error")
        .expecting ("the global source is nit", s => s.result.$ == nit)
        .commit ()

    .should ("rethrow the error if no catch step is specified")
        .up (s => s.createArgs = ["do math", "AddOne", "MultiplyByTwo"])
        .given ({ value: 5 })
        .throws ("can't add")
        .expectingPropertyToBeOfType ("error.nit\\.Workflow\\.context", "AddOne.Context")
        .commit ()

    .should ("suppress the output if silent is true")
        .up (s => s.createArgs = ["do silently", "MultiplyByTwo", { silent: true }])
        .given ({ value: 5 })
        .expectingPropertyToBe ("result.output", undefined)
        .commit ()

    .should ("use the provided workflow context")
        .up (s => s.createArgs = ["do math", "AddOne", "MultiplyByTwo"])
        .before (s => s.args = s.object.contextClass.new ({ value: 5 }))
        .throws ("can't add")
        .expectingPropertyToBeOfType ("error.nit\\.Workflow\\.context", "AddOne.Context")
        .commit ()

    .should ("handle the break step")
        .up (s => s.AddOne = nit.WorkflowStep.defineSubclass ("AddOne")
            .onRun (ctx => ctx.value += 1)
        )
        .up (s => s.MultiplyByTwo = nit.WorkflowStep.defineSubclass ("MultiplyByTwo")
            .onRun (ctx => ctx.value *= 2)
        )
        .up (s => s.createArgs = ["do math", "AddOne", "break", "MultiplyByTwo"])
        .given ({ value: 5 })
        .expectingPropertyToBe ("result.output", 6)
        .commit ()

    .should ("handle the continue step")
        .up (s => s.createArgs = ["do math", "AddOne", "continue", "MultiplyByTwo"])
        .given ({ value: 5 })
        .expectingPropertyToBe ("result.output", 12)
        .commit ()

    .should ("handle the return step")
        .up (s => s.createArgs = ["do math", { steps: ["AddOne", { type: "return", value: 100 }, "MultiplyByTwo"] }])
        .given ({ value: 5 })
        .expectingPropertyToBe ("result.output", 100)
        .commit ()
;


test.method ("nit.Workflow", "defineWorkflowClass", true)
    .should ("throw if the hook method does not return a class")
        .up (s => s.class = s.class.defineSubclass ("MyWorkflow"))
        .throws ("error.workflow_not_found")
        .commit ()

    .should ("not throw if the hook returns a class")
        .up (s => s.class = s.class.defineSubclass ("MyWorkflow")
            .onDefineWorkflowClass (() => nit.defineClass ("WorkflowOne"))
        )
        .expectingPropertyToBe ("result.name", "WorkflowOne")
        .commit ()
;


test.method ("nit.Workflow", "lookup", true)
    .should ("throw if the named workflow is not found")
        .given ("echo-test")
        .throws ("error.workflow_not_found")
        .commit ()

    .should ("try to lookup the named workflow")
        .up (() => nit.defineWorkflow ("test.workflows.MyFlow"))
        .given ("test:my-flow")
        .returnsInstanceOf (Function)
        .commit ()
;


test.method ("nit", "runWorkflow", true)
    .should ("run the specified workflow")
        .project ("project-a", true)
        .given ("nit:log-message")
        .mock (nit, "log")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "aloha")
        .commit ()
;

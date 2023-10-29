/* eslint-disable  no-template-curly-in-string */

nit.require ("nit.Workflow");


test.method ("workflowsteps.Subroutine", "run")
    .up (s => s.AddOne = nit.defineWorkflowStep ("AddOne")
        .field ("<value>", "integer", "The value to be incremented.", "${input}", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            ctx.steps.push (this.constructor.simpleName);

            return this.value + 1;
        })
    )
    .up (s => s.MultiplyByTwo = nit.defineWorkflowStep ("MultiplyByTwo")
        .field ("<value>", "integer", "The value to be doubled.", "${input}", { exprAllowed: true })
        .onRun (async function (ctx)
        {
            ctx.steps.push (this.constructor.simpleName);

            return this.value * 2;
        })
    )
    .snapshot ()

    .should ("run a subroutine")
        .up (s => s.createArgs = "my-subroutine")
        .up (s => s.workflow = new nit.Workflow (
        {
            subroutines:
            [
            {
                name: "my-subroutine",
                steps:
                [
                    "add-one",
                    "multiply-by-two"
                ]
            }
            ]
        }))
        .up (s => s.args = nit.Workflow.Context.new (
        {
            input: 5,
            steps: [],
            workflow: s.workflow
        }))
        .expectingPropertyToBe ("result.output", 12)
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo"])
        .commit ()


    .should ("handle the break control")
        .up (s => s.createArgs = "my-subroutine")
        .up (s => s.workflow = new nit.Workflow (
        {
            subroutines:
            [
            {
                name: "my-subroutine",
                steps:
                [
                    "add-one",
                    "break",
                    "multiply-by-two"
                ]
            }
            ]
        }))
        .up (s => s.args = nit.Workflow.Context.new (
        {
            input: 5,
            steps: [],
            workflow: s.workflow
        }))
        .expectingPropertyToBe ("result.output", 6)
        .expectingPropertyToBe ("result.steps", ["AddOne"])
        .commit ()


    .should ("ignore the continue control")
        .up (s => s.createArgs = "my-subroutine")
        .up (s => s.workflow = new nit.Workflow (
        {
            subroutines:
            [
            {
                name: "my-subroutine",
                steps:
                [
                    "add-one",
                    "continue",
                    "multiply-by-two"
                ]
            }
            ]
        }))
        .up (s => s.args = nit.Workflow.Context.new (
        {
            input: 5,
            steps: [],
            workflow: s.workflow
        }))
        .expectingPropertyToBe ("result.output", 12)
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo"])
        .commit ()


    .should ("return the value specified by the return control")
        .up (s => s.createArgs = "my-subroutine")
        .up (s => s.workflow = new nit.Workflow (
        {
            subroutines:
            [
            {
                name: "my-subroutine",
                steps:
                [
                    "add-one",
                    { type: "return", value: "${input * 5}" },
                    "multiply-by-two"
                ]
            }
            ]
        }))
        .up (s => s.args = nit.Workflow.Context.new (
        {
            input: 5,
            steps: [],
            workflow: s.workflow
        }))
        .expectingPropertyToBe ("result.output", 30)
        .expectingPropertyToBe ("result.steps", ["AddOne"])
        .commit ()


    .should ("use the provided input")
        .up (s => s.createArgs = { name: "my-subroutine", input: 15 })
        .up (s => s.workflow = new nit.Workflow (
        {
            subroutines:
            [
            {
                name: "my-subroutine",
                steps:
                [
                    "add-one",
                    "multiply-by-two"
                ]
            }
            ]
        }))
        .up (s => s.args = nit.Workflow.Context.new (
        {
            input: 5,
            steps: [],
            workflow: s.workflow
        }))
        .expectingPropertyToBe ("result.output", 32)
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo"])
        .commit ()
;

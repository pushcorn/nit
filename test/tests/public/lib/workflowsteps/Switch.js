/* eslint-disable  no-template-curly-in-string */

nit.require ("nit.Workflow");


test.method ("workflowsteps.Switch", "run")
    .should ("run the first step that matches the condition")
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
        .up (s => s.createArgs =
        {
            steps:
            [
            {
                type: "AddOne",
                condition: "${case == 1}"
            }
            ,
            {
                type: "MultiplyByTwo",
                condition: "${case == 2}"
            }
            ,
            {
                type: "AddOne",
                value: 9
            }
            ]
        })
        .given ({ case: 2, input: 10, steps: [] })
        .expectingPropertyToBe ("result.output", 20)
        .expectingPropertyToBe ("result.steps", ["MultiplyByTwo"])
        .commit ()

    .reset ()
        .up (s => s.createArgs =
        {
            steps:
            [
            {
                type: "AddOne",
                condition: "${case == 1}"
            }
            ,
            {
                type: "MultiplyByTwo",
                condition: "${case == 2}"
            }
            ,
            {
                type: "AddOne",
                condition: "${case == 9}",
                value: 9
            }
            ]
        })
        .given ({ case: 10, input: 10, steps: [] })
        .expectingPropertyToBe ("result.output", 10)
        .expectingPropertyToBe ("result.steps", [])
        .commit ()
;

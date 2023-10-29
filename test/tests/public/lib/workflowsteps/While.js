/* eslint-disable  no-template-curly-in-string */

nit.require ("nit.Workflow");


test.method ("workflowsteps.While", "run")
    .should ("run the steps until the condition is true")
        .up (s => s.AddOne = nit.defineWorkflowStep ("AddOne")
            .field ("<value>", "integer", "The value to be incremented.", "${input}", { exprAllowed: true })
            .onRun (async function (ctx)
            {
                ctx.counts++;

                return this.value + 2;
            })
        )
        .up (s => s.createArgs =
        {
            condition: "${output < 10}",
            steps: "add-one"
        })
        .given ({ input: 1, counts: 0 })
        .expectingPropertyToBe ("result.output", 11)
        .expectingPropertyToBe ("result.counts", 5)
        .commit ()

    .should ("stop the loop when the break step is encountered")
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
            condition: true,
            steps:
            [
                "AddOne",
                {
                    type: "break",
                    condition: "${input > 20}"
                }
                ,
                "MultiplyByTwo"
            ]
        })
        .given ({ input: 5, steps: [] })
        .expectingPropertyToBe ("result.output", 27)
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo", "AddOne", "MultiplyByTwo", "AddOne"])
        .commit ()

    .should ("skip the steps after the continue step and run the loop again")
        .up (s => s.AddOne = nit.defineWorkflowStep ("AddOne")
            .field ("<value>", "integer", "The value to be incremented.", "${input}", { exprAllowed: true })
            .onRun (async function (ctx)
            {
                ctx.steps.push (this.constructor.simpleName);
                ctx.numbers.push (this.value + 1);

                return this.value + 1;
            })
        )
        .up (s => s.MultiplyByTwo = nit.defineWorkflowStep ("MultiplyByTwo")
            .field ("<value>", "integer", "The value to be doubled.", "${input}", { exprAllowed: true })
            .onRun (async function (ctx)
            {
                ctx.steps.push (this.constructor.simpleName);
                ctx.numbers.push (this.value * 2);

                return this.value * 2;
            })
        )
        .up (s => s.createArgs =
        {
            condition: "${input < 20}",
            steps:
            [
                "AddOne",
                {
                    type: "continue",
                    condition: "${input < 4}"
                }
                ,
                "MultiplyByTwo"
            ]
        })
        .given ({ input: 1, steps: [], numbers: [] })
        .expectingPropertyToBe ("result.numbers", [2, 3, 4, 8, 9, 18, 19, 38])
        .expectingPropertyToBe ("result.output", 38)
        .expectingPropertyToBe ("result.steps", ["AddOne", "AddOne", "AddOne", "MultiplyByTwo", "AddOne", "MultiplyByTwo", "AddOne", "MultiplyByTwo"])
        .commit ()

    .should ("stop and return a value when the return step is encountered")
        .up (s => s.AddOne = nit.defineWorkflowStep ("AddOne")
            .field ("<value>", "integer", "The value to be incremented.", "${input}", { exprAllowed: true })
            .onRun (async function (ctx)
            {
                ctx.steps.push (this.constructor.simpleName);
                ctx.numbers.push (this.value + 1);

                return this.value + 1;
            })
        )
        .up (s => s.MultiplyByTwo = nit.defineWorkflowStep ("MultiplyByTwo")
            .field ("<value>", "integer", "The value to be doubled.", "${input}", { exprAllowed: true })
            .onRun (async function (ctx)
            {
                ctx.steps.push (this.constructor.simpleName);
                ctx.numbers.push (this.value * 2);

                return this.value * 2;
            })
        )
        .up (s => s.createArgs =
        {
            steps:
            [
                "AddOne",
                {
                    type: "return",
                    condition: "${input > 20}",
                    value: "${input * 3}"
                }
                ,
                "MultiplyByTwo"
            ]
        })
        .given ({ input: 1, steps: [], numbers: [] })
        .expectingPropertyToBe ("result.numbers", [2, 4, 5, 10, 11, 22, 23])
        .expectingPropertyToBe ("result.output", 69)
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo", "AddOne", "MultiplyByTwo", "AddOne", "MultiplyByTwo", "AddOne"])
        .commit ()

    .should ("stop if one of the step cancled the parent")
        .up (s => s.AddOne = nit.defineWorkflowStep ("AddOne")
            .field ("<value>", "integer", "The value to be incremented.", "${input}", { exprAllowed: true })
            .onRun (async function (ctx)
            {
                ctx.steps.push (this.constructor.simpleName);
                ctx.numbers.push (this.value + 1);

                return this.value + 1;
            })
        )
        .up (s => s.MultiplyByTwo = nit.defineWorkflowStep ("MultiplyByTwo")
            .field ("<value>", "integer", "The value to be doubled.", "${input}", { exprAllowed: true })
            .onRun (async function (ctx)
            {
                ctx.steps.push (this.constructor.simpleName);
                ctx.numbers.push (this.value * 2);

                if (this.value * 2 > 20)
                {
                    ctx.parent.cancel ();
                }

                return this.value * 2;
            })
        )
        .up (s => s.createArgs =
        {
            steps:
            [
                "AddOne",
                "MultiplyByTwo"
            ]
        })
        .given ({ input: 1, steps: [], numbers: [] })
        .expectingPropertyToBe ("result.numbers", [2, 4, 5, 10, 11, 22])
        .expectingPropertyToBe ("result.output", 11)
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo", "AddOne", "MultiplyByTwo", "AddOne", "MultiplyByTwo"])
        .commit ()
;

/* eslint-disable  no-template-curly-in-string */

nit.require ("nit.Workflow");


test.method ("workflowsteps.ForEach", "run")
    .should ("loop through an array of items")
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
                "add-one",
                "multiply-by-two",
                {
                    type: "assign",
                    key: "numbers",
                    mode: "append"
                }
            ]
        })
        .given ({ input: [7, 8, 9], steps: [], numbers: [] })
        .expectingPropertyToBe ("result.output", 20)
        .expectingPropertyToBe ("result.numbers", [16, 18, 20])
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo", "AddOne", "MultiplyByTwo", "AddOne", "MultiplyByTwo"])
        .commit ()


    .should ("throw if one of the step failed")
        .up (s => s.count = 0)
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
                if (s.count++ == 1)
                {
                    throw new Error ("Cannot multiply!");
                }

                ctx.steps.push (this.constructor.simpleName);

                return this.value * 2;
            })
        )
        .up (s => s.createArgs =
        {
            steps: ["add-one", "multiply-by-two"]
        })
        .given ({ input: [7, 8, 9], steps: [] })
        .throws ("Cannot multiply!")
        .expectingPropertyToBe ("error.nit\\.Workflow\\.context.output", 9)
        .expectingPropertyToBe ("error.nit\\.Workflow\\.context.steps", ["AddOne", "MultiplyByTwo", "AddOne"])
        .commit ()


    .should ("handle the break control")
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
                "add-one",
                "multiply-by-two",
                {
                    type: "break",
                    condition: "${key == 1}"
                }
            ]
        })
        .given ({ input: [7, 8, 9], steps: [] })
        .expectingPropertyToBe ("result.output", 18)
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo", "AddOne", "MultiplyByTwo"])
        .commit ()


    .should ("handle the cancellation")
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
                let n = this.value * 2;

                ctx.steps.push (this.constructor.simpleName);
                ctx.numbers.push (n);

                if (ctx.key == 1)
                {
                    ctx.parent.cancel ();
                }

                return n;
            })
        )
        .up (s => s.createArgs =
        {
            steps:
            [
                "add-one",
                "multiply-by-two"
            ]
        })
        .given ({ input: [7, 8, 9], steps: [], numbers: [] })
        .expectingPropertyToBe ("result.output", 9)
        .expectingPropertyToBe ("result.numbers", [16, 18])
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo", "AddOne", "MultiplyByTwo"])
        .commit ()


    .should ("handle the continue control")
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
                let n = this.value * 2;

                ctx.steps.push (this.constructor.simpleName);
                ctx.numbers.push (n);

                return n;
            })
        )
        .up (s => s.createArgs =
        {
            steps:
            [
                "add-one",
                {
                    type: "continue",
                    condition: "${key == 1}"
                },
                "multiply-by-two"
            ]
        })
        .given ({ input: [7, 8, 9], steps: [], numbers: [] })
        .expectingPropertyToBe ("result.output", 20)
        .expectingPropertyToBe ("result.numbers", [16, 20])
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo", "AddOne", "AddOne", "MultiplyByTwo"])
        .commit ()


    .should ("handle the return control")
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
                "add-one",
                {
                    type: "return",
                    condition: "${key == 1}",
                    value: 100
                },
                "multiply-by-two"
            ]
        })
        .given ({ input: [7, 8, 9], steps: [] })
        .expectingPropertyToBe ("result.output", 100)
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo", "AddOne"])
        .commit ()


    .should ("be able to process the items in parallel mode")
        .up (s => s.notifiers = {})
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

                let notifier = nit.new ("nit.utils.Notifier");

                s.notifiers[ctx.key] = notifier;

                await notifier.listen ();

                if (ctx.key == 1 || ctx.key == 3)
                {
                    throw new Error ("err");
                }

                return this.value * 2;
            })
        )
        .up (s => s.createArgs =
        {
            concurrency: 4,
            steps:
            [
                "add-one",
                "multiply-by-two"
            ]
        })
        .given ({ input: [5, 7, 13, 6, 2], steps: [] })
        .before (s => process.nextTick (async function ()
        {
            s.done = nit.new ("nit.utils.Notifier");

            let orders = [3, 2, 4, 1, 0];
            let id, n;

            while ((id = orders.shift ()) !== undefined)
            {
                n = s.notifiers[id];

                if (!n)
                {
                    orders.unshift (id);
                }
                else
                {
                    n.notify ();
                }

                await nit.sleep (10);
            }

            s.done.notify ();
        }))
        .after (s => s.done.listen ())
        .after (s => s.errors = s.result.output.errors.map (e => e.message))
        .expectingPropertyToBe ("result.output.results", [28, 6, 12])
        .expectingPropertyToBe ("errors", ["err", "err"])
        .commit ()


    .should ("be able to handle the break control in parallel mode (ignore the breaks and cancel unfinished")
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
            concurrency: 4,
            steps:
            [
                "add-one",
                {
                    type: "break",
                    condition: "${key == 1 || key == 3}"
                }
                ,
                "multiply-by-two"
            ]
        })
        .given ({ input: [5, 7, 13, 6, 2], steps: [] })
        .expectingPropertyToBe ("result.output.results", [12, 28])
        .expectingPropertyToBe ("result.steps", ["AddOne", "AddOne", "AddOne", "AddOne", "MultiplyByTwo", "MultiplyByTwo"])
        .commit ()


    .should ("be able to handle the continue control in parallel mode (ignore the continues and run unfinished)")
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
            concurrency: 4,
            steps:
            [
                "add-one",
                {
                    type: "continue",
                    condition: "${key == 1 || key == 3}"
                }
                ,
                "multiply-by-two"
            ]
        })
        .given ({ input: [5, 7, 13, 6, 2], steps: [] })
        .expectingPropertyToBe ("result.output.results", [12, 28, 6])
        .expectingPropertyToBe ("result.steps", ["AddOne", "AddOne", "AddOne", "AddOne", "MultiplyByTwo", "MultiplyByTwo", "AddOne", "MultiplyByTwo"])
        .commit ()


    .should ("be able to handle the return control in parallel mode (return the first result and cancel others)")
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
            concurrency: 4,
            steps:
            [
                "add-one",
                {
                    type: "return",
                    condition: "${key == 1 || key == 3}",
                    value: "${input * 3 }"
                }
                ,
                "multiply-by-two"
            ]
        })
        .given ({ input: [5, 7, 13, 6, 2], steps: [] })
        .expectingPropertyToBe ("result.output", 24)
        .expectingPropertyToBe ("result.steps", ["AddOne", "AddOne", "AddOne", "AddOne", "MultiplyByTwo", "MultiplyByTwo"])
        .commit ()
;

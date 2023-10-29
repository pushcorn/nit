/* eslint-disable  no-template-curly-in-string */

nit.require ("nit.Workflow");


test.method ("workflowsteps.Block", "run")
    .should ("run the specified steps sequentially by default")
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
                "multiply-by-two"
            ]
        })
        .given ({ output: 5, steps: [] })
        .expectingPropertyToBe ("result.output", 12)
        .expectingPropertyToBe ("result.steps", ["AddOne", "MultiplyByTwo"])
        .commit ()

    .should ("run the steps in parallel if mode is 'parallel'")
        .up (s => s.AddOne = nit.defineWorkflowStep ("AddOne")
            .field ("<value>", "integer", "The value to be incremented.", "${input}", { exprAllowed: true })
            .onRun (async function (ctx)
            {
                await (s.AddOne.notifier = nit.new ("nit.utils.Notifier")).listen ();

                ctx.steps.push (this.constructor.simpleName);

                return this.value + 1;
            })
        )
        .up (s => s.MultiplyByTwo = nit.defineWorkflowStep ("MultiplyByTwo")
            .field ("<value>", "integer", "The value to be doubled.", "${input}", { exprAllowed: true })
            .onRun (async function (ctx)
            {
                await (s.MultiplyByTwo.notifier = nit.new ("nit.utils.Notifier")).listen ();

                ctx.steps.push (this.constructor.simpleName);

                return this.value * 2;
            })
        )
        .up (s => s.createArgs =
        {
            mode: "parallel",
            steps:
            [
                "add-one",
                "multiply-by-two"
            ]
        })
        .given ({ input: 5, steps: [] })
        .before (s => setTimeout (() =>
        {
            s.MultiplyByTwo.notifier.notify ();
            s.AddOne.notifier.notify ();
        }, 10))
        .expectingPropertyToBe ("result.output", { results: [10, 6], errors: [] })
        .expectingPropertyToBe ("result.steps", ["MultiplyByTwo", "AddOne"])
        .commit ()

    .should ("run all steps in parallel if mode is 'all' even if a step failed")
        .up (s => s.AddOne = nit.defineWorkflowStep ("AddOne")
            .field ("<value>", "integer", "The value to be incremented.", "${input}", { exprAllowed: true })
            .onRun (async function (ctx)
            {
                await (s.AddOne.notifier = nit.new ("nit.utils.Notifier")).listen ();

                ctx.steps.push (this.constructor.simpleName);

                return this.value + 1;
            })
        )
        .up (s => s.MultiplyByTwo = nit.defineWorkflowStep ("MultiplyByTwo")
            .field ("<value>", "integer", "The value to be doubled.", "${input}", { exprAllowed: true })
            .onRun (async function (ctx)
            {
                await (s.MultiplyByTwo.notifier = nit.new ("nit.utils.Notifier")).listen ();

                ctx.steps.push (this.constructor.simpleName);

                return this.value * 2;
            })
        )
        .up (s => s.ThrowError = nit.defineWorkflowStep ("ThrowError")
            .onRun (async function (ctx)
            {
                await (s.ThrowError.notifier = nit.new ("nit.utils.Notifier")).listen ();

                ctx.steps.push (this.constructor.simpleName);

                throw new Error ("Surprise!");
            })
        )
        .up (s => s.createArgs = ["add-one", "multiply-by-two", "throw-error", { mode: "all" }])
        .given ({ input: 5, steps: [] })
        .before (s => setTimeout (() =>
        {
            s.ThrowError.notifier.notify ();
            s.MultiplyByTwo.notifier.notify ();
            s.AddOne.notifier.notify ();
        }, 10))
        .expectingPropertyToBe ("result.output.results", [10, 6])
        .expectingPropertyToBe ("result.output.errors.length", 1)
        .expectingPropertyToBe ("result.output.errors.0.message", "Surprise!")
        .expectingPropertyToBe ("result.steps", ["ThrowError", "MultiplyByTwo", "AddOne"])
        .commit ()

    .should ("throw if the unsupported step was specified for the parallel mode")
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
        .up (s => s.ThrowError = nit.defineWorkflowStep ("ThrowError")
            .onRun (async function (ctx)
            {
                ctx.steps.push (this.constructor.simpleName);

                throw new Error ("Surprise!");
            })
        )
        .up (s => s.createArgs = ["add-one", "break", "multiply-by-two", "throw-error", { mode: "all" }])
        .throws ("error.invalid_parallel_step")
        .commit ()

    .should ("throw and stop other steps if the mode is parallel and one of the step failed")
        .up (s => s.AddOne = nit.defineWorkflowStep ("AddOne")
            .onRun (async function (ctx)
            {
                let self = this;

                return nit.Queue ()
                    .stopOn (() => ctx.canceled)
                    .push (() =>
                    {
                        let p = nit.sleep (1000);

                        ctx.once ("cancel", () =>
                        {
                            s.AddOne.canceled = true;
                            p.cancel ();
                        });

                        return p;
                    })
                    .push (() =>
                    {
                        ctx.steps.push (self.constructor.simpleName);
                        return ctx.value += 1;
                    })
                    .run ()
                ;
            })
        )
        .up (s => s.MultiplyByTwo = nit.defineWorkflowStep ("MultiplyByTwo")
            .onRun (async function (ctx)
            {
                let self = this;

                return nit.Queue ()
                    .stopOn (() => ctx.canceled)
                    .push (() =>
                    {
                        let p = nit.sleep (50);

                        ctx.once ("cancel", () =>
                        {
                            s.MultiplyByTwo.canceled = true;
                            p.cancel ();
                        });

                        return p;
                    })
                    .push (() =>
                    {
                        ctx.steps.push (self.constructor.simpleName);
                        return ctx.value *= 2;
                    })
                    .run ()
                ;
            })
        )
        .up (s => s.ThrowError = nit.defineWorkflowStep ("ThrowError")
            .onRun (async function (ctx)
            {
                let self = this;

                return nit.Queue ()
                    .push (() => nit.sleep (2))
                    .push (() =>
                    {
                        ctx.steps.push (self.constructor.simpleName);

                        throw new Error ("Surprise!");
                    })
                    .run ()
                ;
            })
        )
        .up (s => s.createArgs = ["add-one", "multiply-by-two", "throw-error", { mode: "parallel" }])
        .given ({ value: 5, steps: [] })
        .throws ("Surprise!")
        .expectingPropertyToBe ("error.nit\\.Workflow\\.context.steps", ["ThrowError"])
        .expectingPropertyToBe ("AddOne.canceled", true)
        .expectingPropertyToBe ("MultiplyByTwo.canceled", true)
        .commit ()
;

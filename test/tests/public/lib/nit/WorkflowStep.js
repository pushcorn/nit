/* eslint-disable  no-template-curly-in-string */


test.method ("nit.WorkflowStep", "evaluate")
    .should ("evaluate all of the step's fields")
        .up (s => s.class = s.class.defineSubclass ("MyStep")
            .field ("delay", "integer", "Job delay", "${ speed / 10 }", { exprAllowed: true })
        )
        .up (s => s.createArgs = "MyStep")
        .up (s => s.args = { speed: 60 })
        .expectingPropertyToBe ("result.delay", 6)
        .commit ()
;


test.method ("nit.WorkflowStep", "nit.Object.caster", true)
    .should ("try to cast the given string to a step")
        .given ("break")
        .returnsInstanceOf ("workflowsteps.Break")
        .commit ()

    .should ("try to cast the given object to a step")
        .given ({ type: "break" })
        .returnsInstanceOf ("workflowsteps.Break")
        .commit ()

    .should ("just return a non-string and non-object value")
        .given (9)
        .returns (9)
        .commit ()

    .should ("throw if the step was not found")
        .given ({ type: "break345" })
        .throws (/component.*not found.*Config.*/)
        .commit ()
;


test.method ("nit.WorkflowStep", "run")
    .should ("run the step")
        .up (s => s.class = s.class.defineSubclass ("AddOne")
            .field ("<value>", "integer")
            .onRun (function ()
            {
                return this.value + 1;
            })
        )
        .up (s => s.createArgs = 10)
        .returnsInstanceOf ("nit.Workflow.Context")
        .expectingPropertyToBe ("result.output", 11)
        .commit ()

    .should ("handle the error if the catch step is specified")
        .up (s => s.Catcher = s.class.defineSubclass ("Catcher")
            .onRun (function (ctx)
            {
                ctx.handled = ctx.error;

                return 20;
            })
        )
        .up (s => s.class = s.class.defineSubclass ("AddOne")
            .field ("<value>", "integer")
            .onRun (function ()
            {
                throw new Error ("NO!!");
            })
        )
        .up (s => s.createArgs = [10, { catch: "Catcher" }])
        .returnsInstanceOf ("nit.Workflow.Context")
        .expectingPropertyToBe ("result.output", 20)
        .expectingPropertyToBe ("result.handled.message", "NO!!")
        .commit ()

    .should ("rethrow the error if no hanlder was specified")
        .up (s => s.class = s.class.defineSubclass ("AddOne")
            .field ("<value>", "integer")
            .onRun (function ()
            {
                throw new Error ("NO!!");
            })
        )
        .up (s => s.createArgs = 10)
        .throws ("NO!!")
        .commit ()

    .should ("skip if the condition evaluates to false")
        .up (s => s.class = s.class.defineSubclass ("AddOne")
            .field ("<value>", "integer")
            .onRun (function ()
            {
                throw new Error ("NO!!");
            })
        )
        .up (s => s.createArgs = [10, { condition: "${ count > 10 }" }])
        .given ({ count: 10 })
        .returnsInstanceOf ("nit.Workflow.Context")
        .expectingPropertyToBe ("result.output", undefined)
        .commit ()

    .should ("run if the condition evaluates to true")
        .up (s => s.class = s.class.defineSubclass ("AddOne")
            .field ("<value>", "integer")
            .onRun (function ()
            {
                return this.value + 1;
            })
        )
        .up (s => s.createArgs = [10, { condition: "${ count > 10 }" }])
        .given ({ count: 20 })
        .returnsInstanceOf ("nit.Workflow.Context")
        .expectingPropertyToBe ("result.output", 11)
        .commit ()
;

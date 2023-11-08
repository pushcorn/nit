/* eslint-disable  no-template-curly-in-string */


test.method ("nit.WorkflowStep", "evaluate")
    .should ("evaluate all of the step's fields")
        .up (s => s.class = s.class.defineSubclass ("MyStep")
            .field ("delay", "integer", "Job delay", "${ speed / 10 }", { exprAllowed: true })
        )
        .up (s => s.args = { speed: 60 })
        .returnsInstanceOf ("MyStep")
        .expectingPropertyToBe ("result.delay", 6)
        .expecting ("a new step is returned", s => s.result != s.object)
        .commit ()

    .should ("not evaluate the constant fields")
        .up (s => s.class = s.class.defineSubclass ("MyStep")
            .field ("delay", "integer", "Job delay", "${ speed / 10 }", { exprAllowed: true })
        )
        .up (s => s.createArgs = { delay: 20 })
        .up (s => s.args = { speed: 60 })
        .returnsInstanceOf ("MyStep")
        .expectingPropertyToBe ("result.delay", 20)
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

    .should ("track the fields with constant (non-expression) values")
        .given ({ type: "assign", key: "test-key", value: "${input * 3}"})
        .returnsInstanceOf ("workflowsteps.Assign")
        .expectingPropertyToBe ("result.nit\\.WorkflowStep\\.constantFields", ["key"])
        .commit ()
;


test.method ("nit.WorkflowStep", "run")
    .should ("run the step")
        .up (s => s.class = s.class.defineSubclass ("AddOne")
            .onRun (function (ctx)
            {
                return ++ctx.data.value;
            })
        )
        .up (s => s.createArgs = { exportAs: "testResult" })
        .given ({ data: { value: 10 } })
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("result.output", 11)
        .expectingPropertyToBe ("result.parent.testResult", 11)
        .expectingPropertyToBe ("result.data", { value: 11 })
        .commit ()

    .should ("handle the error if the catch step is specified")
        .up (s => s.Catcher = s.class.defineSubclass ("Catcher")
            .onRun (function (ctx)
            {
                ctx.root.handled = ctx.parent.error;

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
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("result.output", 20)
        .expectingPropertyToBe ("result.root.handled.message", "NO!!")
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
        .returnsInstanceOf ("nit.Workflow.Subcontext")
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
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("result.output", 11)
        .expectingPropertyToBe ("result.owner.type", "AddOne")
        .commit ()
;

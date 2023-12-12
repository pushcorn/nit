test.method ("nit.utils.StagedQueue", "createStage", true)
    .should ("turn a task into a stage function")
        .given ("addOne", v => v + 1)
        .returnsInstanceOf ("function")
        .expectingPropertyToBeOfType ("result.needle", "function")
        .expectingMethodToReturnValue ("result", { args: [3] }, 4)
        .expectingMethodToReturnValue ("result.needle", { name: "addOne" }, true)
        .commit ()
;


test.method ("nit.utils.StagedQueue", "until", true)
    .should ("add a stop condition")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .given (ctx => ctx.result > 3)
        .returnsResultOfExpr ("class")
        .expecting ("the condition returns true with value %{value}", s => s.class.untils[0] ({ args: [{ result: 4 }] }))
        .commit ()

    .should ("wrap a value into a function")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .given (4)
        .returnsResultOfExpr ("class")
        .expecting ("the condition returns true with value %{value}", s => s.class.untils[0] ({ result: 4 }))
        .commit ()
;


test.method ("nit.utils.StagedQueue", "lpush", true)
    .should ("add a stage to the head of the queue")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.stages.push (() => true))
        .given ("preInit", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.stages.0.name", "preInit")
        .commit ()
;


test.method ("nit.utils.StagedQueue", "push", true)
    .should ("add a stage to the tail of the queue")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.stages.push (() => true))
        .given ("postInit", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.stages.1.name", "postInit")
        .commit ()
;


test.method ("nit.utils.StagedQueue", "before", true)
    .should ("add a task to before the specifed stage")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step2", "step1.1", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.stages.1.name", "step1.1")
        .commit ()

    .should ("use the target name as the stage name if not provided")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step2", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.stages.1.name", "step2")
        .expectingMethodToReturnValue ("class.stages.1", {}, false)
        .commit ()

    .should ("add the task to head of the queue if the target was not found")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step3", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.stages.0.name", "step3")
        .commit ()
;


test.method ("nit.utils.StagedQueue", "after", true)
    .should ("add a task to after the specifed stage")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step2", "step1.1", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.stages.2.name", "step1.1")
        .commit ()

    .should ("use the target name as the stage name if not provided")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step2", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.stages.1.name", "step2")
        .expectingMethodToReturnValue ("class.stages.2", {}, false)
        .commit ()

    .should ("add the task to tail of the queue if the target was not found")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step3", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.stages.2.name", "step3")
        .commit ()
;


test.method ("nit.utils.StagedQueue", "replace", true)
    .should ("replace a stage with the specified task")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step2", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.stages.length", 2)
        .expectingPropertyToBe ("class.stages.1.name", "step2")
        .expectingMethodToReturnValue ("class.stages.1", {}, false)
        .commit ()

    .should ("add the task to tail of the queue if the target was not found")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step3", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.stages.2.name", "step3")
        .commit ()
;


test.method ("nit.utils.StagedQueue", "run", true)
    .should ("run the queue")
        .up (s => s.class = s.class.defineSubclass ("MyQueue")
            .push ("step1", function ()
            {
                return 100;
            })
            .onSuccess (function ()
            {
                return this.result * 2;
            })
            .onComplete (function ()
            {
                return this.result * 2;
            })
        )
        .returns (400)
        .commit ()
;


test.method ("nit.utils.StagedQueue", "run")
    .should ("run the queue")
        .up (s => s.class = s.class.defineSubclass ("MyQueue")
            .onInit (function ()
            {
                var q = this;

                q.args = { value: q.args[0] };
            })
            .until (function (ctx)
            {
                return ctx.value > 103;
            })
            .push ("step1", function ()
            {
                return 100;
            })
            .before ("step1", "step0", function (ctx)
            {
                return ctx.value += 2;
            })
            .after ("step1", "step2", function (ctx)
            {
                return ctx.value += 5;
            })
            .after ("step2", "step3", function (ctx)
            {
                return ctx.value += 8;
            })
        )
        .up (s => s.createArgs = { args: 99 })
        .returns (106)
        .commit ()

    .reset ()
        .up (s => s.class = s.class.defineSubclass ("MyQueue")
            .push ("step1", function ()
            {
                throw new Error ("ERR");
            })
            .onFailure (function ()
            {
                this.catched = true;

                throw this.error;
            })
        )
        .throws ("ERR")
        .expectingPropertyToBe ("object.catched", true)
        .commit ()
;

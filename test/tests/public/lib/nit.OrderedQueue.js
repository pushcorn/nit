test.method ("nit.OrderedQueue", "createStep", true)
    .should ("turn a task into a step function")
        .given ("addOne", (_, v) => v + 1)
        .returnsInstanceOf ("function")
        .expectingMethodToReturnValue ("result", { args: [3] }, 4)
        .commit ()
;


test.method ("nit.OrderedQueue", "stop")
    .should ("return an instance of nit.Queue.Stop")
        .given (10)
        .returnsInstanceOf (nit.Queue.Stop)
        .expectingPropertyToBe ("result.next", 10)
        .commit ()
;


test.method ("nit.OrderedQueue", "until", true)
    .should ("add a stop condition")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .given ((_, ctx) => ctx.result > 3)
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


test.method ("nit.OrderedQueue", "lpush", true)
    .should ("add a step to the head of the queue")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.tasks.push (() => true))
        .given ("preInit", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.tasks.0.name", "preInit")
        .commit ()
;


test.method ("nit.OrderedQueue", "push", true)
    .should ("add a step to the tail of the queue")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.tasks.push (() => true))
        .given ("postInit", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.tasks.1.name", "postInit")
        .commit ()
;


test.method ("nit.OrderedQueue", "step", true)
    .should ("add a step to the tail of the queue")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.tasks.push (() => true))
        .given ("postInit", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.tasks.1.name", "postInit")
        .commit ()
;


test.method ("nit.OrderedQueue", "before", true)
    .should ("add a task to before the specifed step")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step2", "step1.1", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.tasks.1.name", "step1.1")
        .commit ()

    .should ("use the target name as the step name if not provided")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step2", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.tasks.1.name", "step2")
        .expectingMethodToReturnValue ("class.tasks.1", {}, false)
        .commit ()

    .should ("add the task to head of the queue if the target was not found")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step3", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.tasks.0.name", "step3")
        .commit ()
;


test.method ("nit.OrderedQueue", "after", true)
    .should ("add a task to after the specifed step")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step2", "step1.1", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.tasks.2.name", "step1.1")
        .commit ()

    .should ("use the target name as the step name if not provided")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step2", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.tasks.1.name", "step2")
        .expectingMethodToReturnValue ("class.tasks.2", {}, false)
        .commit ()

    .should ("add the task to tail of the queue if the target was not found")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step3", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.tasks.2.name", "step3")
        .commit ()
;


test.method ("nit.OrderedQueue", "replace", true)
    .should ("replace a step with the specified task")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step2", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.tasks.length", 2)
        .expectingPropertyToBe ("class.tasks.1.name", "step2")
        .expectingMethodToReturnValue ("class.tasks.1", {}, false)
        .commit ()

    .should ("add the task to tail of the queue if the target was not found")
        .up (s => s.class = s.class.defineSubclass ("MyQueue"))
        .up (s => s.class.push ("step1", () => true))
        .up (s => s.class.push ("step2", () => true))
        .given ("step3", () => false)
        .returnsResultOfExpr ("class")
        .expectingPropertyToBe ("class.tasks.2.name", "step3")
        .commit ()
;


test.method ("nit.OrderedQueue", "run", true)
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


test.method ("nit.OrderedQueue", "run")
    .should ("run the queue")
        .up (s => s.called = [])
        .up (s => s.class = s.class.defineSubclass ("MyQueue")
            .onInit (function (_, value)
            {
                s.called.push ("MyQueueInit");
                this.args = { value };
            })
            .onInit (function (_, ctx)
            {
                s.called.push ("MyQueueInit2");
                s.ctxValue = ctx.value;
            })
            .until (function (_, ctx)
            {
                return ctx.value > 103;
            })
            .push ("step1", function ()
            {
                return 100;
            })
            .before ("step1", "step0", function (_, ctx)
            {
                return ctx.value += 2;
            })
            .after ("step1", "step2", function (_, ctx)
            {
                return ctx.value += 5;
            })
            .after ("step2", "step3", function (_, ctx)
            {
                return ctx.value += 8;
            })
        )
        .up (s => s.class = s.class.defineSubclass ("Subqueue")
            .onInit (true, function (_, ctx)
            {
                s.called.push ("SubqueueInit");
                s.subqueueCtxVal = ctx.value;
                nit.throw ("SUB_ERR");
                s.subqueueAfterErr = true;
            })
        )
        .up (s => s.createArgs = { args: 99 })
        .mock (nit.log, "e")
        .returns (106)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /SUB_ERR/)
        .expectingPropertyToBeOfType ("object.queue", "Subqueue")
        .expectingPropertyToBe ("ctxValue", 99)
        .expectingPropertyToBe ("subqueueCtxVal", 99)
        .expectingPropertyToBe ("subqueueAfterErr")
        .expectingPropertyToBe ("called", ["MyQueueInit", "MyQueueInit2", "SubqueueInit"])
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


test.method ("nit.OrderedQueue", "run")
    .should ("run the queue with step markers")
        .up (s => s.called = [])
        .before (s => s.object.anchors ("preInit", "init", "postInit"))
        .before (s => s.object.after ("preInit", () => s.called.push ("preInit")))
        .before (s => s.object.after ("init", () => s.called.push ("init")))
        .before (s => s.object.after ("postInit", () => s.called.push ("postInit")))
        .before (s => s.object.after ("postInit", true, () => s.called.push ("postInitErr") && nit.throw ("POST_INIT_ERR")))
        .before (s => s.object.success (() => s.called.push ("success")))
        .before (s => s.object.complete (() => s.called.push ("complete")))
        .mock (nit.log, "e")
        .returns (6)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /POST_INIT_ERR/)
        .expectingPropertyToBe ("called", ["preInit", "init", "postInit", "postInitErr", "success", "complete"])
        .commit ()

    .should ("throw if one of the task throws")
        .up (s => s.called = [])
        .before (s => s.object.anchors ("preInit", "init", "postInit"))
        .before (s => s.object.after ("preInit", () => s.called.push ("preInit")))
        .before (s => s.object.after ("init", () => nit.throw ("INIT_ERR")))
        .before (s => s.object.after ("postInit", () => s.called.push ("postInit")))
        .before (s => s.object.failure (() => s.called.push ("failure")))
        .before (s => s.object.complete (() => s.called.push ("complete")))
        .returns (3)
        .expectingPropertyToBe ("called", ["preInit", "failure", "complete"])
        .commit ()
;

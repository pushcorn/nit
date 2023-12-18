test.method ("nit.utils.TaskQueue", "enqueue")
    .should ("enqueue the task")
        .up (s => s.createArgs = { concurrency: 2 })
        .up (s => s.taskIds = [])
        .up (s => s.Sleep = nit.defineTask ("test.tasks.Sleep")
            .staticProperty ("nextId", "integer")
            .property ("deferred", "nit.Deferred", () => new nit.Deferred)
            .onConstruct (function ()
            {
                this.id = this.constructor.nextId++;
            })
            .onRun (async function ()
            {
                await this.deferred;

                if (this.id == 3)
                {
                    throw new Error ("TASK_ERR");
                }

                s.taskIds.push (this.id);
            })
        )
        .up (s => s.tasks = nit.each (Array (5), () => new s.Sleep))
        .up (s => s.args = s.tasks[0])
        .mock ("object", "error")
        .before (s => s.object.start ())
        .after (s => s.object.enqueue (s.tasks[1]))
        .after (s => s.object.enqueue (s.tasks[2]))
        .after (s => s.object.enqueue (s.tasks[3]))
        .after (s => s.object.enqueue (s.tasks[4]))
        .after (function (s)
        {
            nit.sleep (50)
                .then (function ()
                {
                    s.tasks[3].deferred.resolve ();
                    s.tasks[1].deferred.resolve ();
                    s.tasks[2].deferred.resolve ();
                    s.tasks[4].deferred.resolve ();
                    s.tasks[0].deferred.resolve ();
                })
            ;
        })
        .after (s => s.object.stop (true))
        .expectingPropertyToBe ("object.stats", { pending: 0, queued: 0 })
        .expectingPropertyToBe ("taskIds", [1, 0, 2, 4])
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /TASK_ERR/)
        .expectingMethodToThrow ("object.enqueue", null, "error.queue_not_started")
        .commit ()
;


test.method ("nit.utils.TaskQueue", "enqueue")
    .should ("replace the existing task of the same type if replace is true")
        .up (s => s.Task1 = nit.defineTask ("test.tasks.Task1").field ("<id>", "integer"))
        .up (s => s.Task2 = nit.defineTask ("test.tasks.Task2").field ("<id>", "integer"))
        .up (s => s.createArgs = { autoStart: true })
        .up (s => s.args = [new s.Task1 (2), true])
        .mock ("object", "next")
        .before (s => s.object.enqueue (new s.Task1 (1), true))
        .before (s => s.object.enqueue (new s.Task2 (3), true))
        .returnsInstanceOf ("nit.utils.TaskQueue")
        .expectingPropertyToBe ("object.queuedTasks.length", 2)
        .expectingPropertyToBe ("object.queuedTasks.0.task.id", 2)
        .expectingPropertyToBe ("object.queuedTasks.1.task.id", 3)
        .commit ()

    .should ("return if there is one pending task of the same type")
        .up (s => s.Task1 = nit.defineTask ("test.tasks.Task1").field ("<id>", "integer"))
        .before (s => s.object.start ())
        .before (s => s.entry1 = new s.class.Entry (new s.Task1 (1)))
        .before (s => s.entry2 = new s.class.Entry (new s.Task2 (2)))
        .before (s => { s.object.pendingTasks[nit.uuid ()] = nit.assign (new nit.Deferred, { entry: s.entry2 }); })
        .before (s => { s.object.pendingTasks[nit.uuid ()] = nit.assign (new nit.Deferred, { entry: s.entry1 }); })
        .up (s => s.args = [new s.Task1 (12), true])
        .returnsInstanceOf ("nit.utils.TaskQueue")
        .expectingPropertyToBe ("object.queuedTasks.length", 0)
        .commit ()

    .should ("return if there is one pending task of the same type")
        .up (s => s.Task1 = nit.defineTask ("test.tasks.Task1").field ("<id>", "integer"))
        .before (s => s.object.start ())
        .before (s => s.entry = new s.class.Entry (new s.Task1 (1)))
        .before (s => { s.object.pendingTasks[nit.uuid ()] = nit.assign (new nit.Deferred, { entry: s.entry }); })
        .up (s => s.args = [new s.Task1 (2), true])
        .returnsInstanceOf ("nit.utils.TaskQueue")
        .expectingPropertyToBe ("object.queuedTasks.length", 0)
        .commit ()
;


test.method ("nit.utils.TaskQueue", "start")
    .should ("clear the task entries")
        .before (s => s.object.queuedTasks.push (new s.class.Entry (nit.new ("test.tasks.Sleep"))))
        .returnsInstanceOf ("nit.utils.TaskQueue")
        .expectingPropertyToBe ("object.state", "started")
        .expectingPropertyToBe ("object.queuedTasks.length", 0)
        .commit ()
;


test.method ("nit.utils.TaskQueue", "stop")
    .should ("stop the queue")
        .up (s => s.createArgs = { concurrency: 2 })
        .up (s => s.taskIds = [])
        .up (s => s.Sleep = nit.defineTask ("test.tasks.Sleep")
            .staticProperty ("nextId", "integer")
            .property ("deferred", "nit.Deferred", () => new nit.Deferred)
            .onConstruct (function ()
            {
                this.id = this.constructor.nextId++;
            })
            .onRun (async function ()
            {
                await this.deferred;

                s.taskIds.push (this.id);
            })
        )
        .up (s => s.tasks = nit.each (Array (5), () => new s.Sleep))
        .mock ("object", "error")
        .before (s => s.object.start ())
        .before (s => s.object.enqueue (s.tasks[0]))
        .before (s => s.object.enqueue (s.tasks[1]))
        .before (s => s.object.enqueue (s.tasks[2]))
        .before (s => s.object.enqueue (s.tasks[3]))
        .before (s => s.object.enqueue (s.tasks[4]))
        .before (function (s)
        {
            nit.sleep (50)
                .then (function ()
                {
                    s.tasks[3].deferred.resolve ();
                    s.tasks[1].deferred.resolve ();
                    s.tasks[2].deferred.resolve ();
                    s.tasks[4].deferred.resolve ();
                    s.tasks[0].deferred.resolve ();
                })
            ;
        })
        .expectingPropertyToBe ("taskIds", [1, 0])
        .expectingMethodToThrow ("object.enqueue", null, "error.queue_not_started")
        .expectingMethodToReturnValueOfType ("object.stop", null, "nit.utils.TaskQueue")
        .commit ()
;


test.method ("nit.utils.TaskQueue", "waitUntilIdle", { createArgs: { autoStart: true } })
    .should ("resolve the returned promise when the the queue becomes idle")
        .up (s => { s.def = new nit.Deferred; })
        .up (s => s.Sleep = nit.defineTask ("test.tasks.Sleep")
            .onRun (() => s.def.promise)
        )
        .before (s => s.object.enqueue (new s.Sleep))
        .before (s => s.object.once ("idle", () => s.idleCalled = true))
        .before (s => setTimeout (() => s.def.resolve (), 10))
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("idleCalled", true)
        .commit ()
;

test.object ("nit.Task")
    .should ("represent a runnable task")
        .expectingPropertyToBeOfType ("result.run", Function)
        .commit ()
;


test.object ("nit.Task.Context")
    .should ("accept another context as its parent")
        .given (nit.Task.Context.new ({ a: 1 }))
        .expectingPropertyToBe ("result.a", 1)
        .commit ()
;


test.method ("nit.Task", "describe", true)
    .should ("set the description metadata")
        .given ("Do something...")
        .expectingPropertyToBe ("class.description", "Do something...")
        .commit ()
;


test.method ("nit.Task", "run")
    .should ("run the task")
        .up (s => s.called = [])
        .up (s => s.class = nit.defineTask ("MyTask")
            .onPreRun (function ()
            {
                s.called.push ("preRun");
            })
            .onPostRun (function ()
            {
                s.called.push ("postRun");

                return { a: 3 };
            })
            .onRun (function ()
            {
                s.called.push ("run");

                return { a: 1 };
            })
        )
        .returnsInstanceOf ("tasks.MyTask.Context")
        .expectingPropertyToBe ("called", ["preRun", "run", "postRun"])
        .expectingPropertyToBe ("result.result", { a: 3 })
        .commit ()

    .should ("use the provided context if possible")
        .up (s => s.class = nit.defineTask ("MyTask")
            .onPreRun (function ()
            {
                s.class.preRunCalled = true;
            })
            .onPostRun (function ()
            {
                s.class.postRunCalled = true;
            })
            .onRun (function ()
            {
                s.class.runCalled = true;

                return { a: 1 };
            })
            .configureComponentMethod ("run", Method =>
            {
                Method.afterComplete ((task, ctx) =>
                {
                    s.class.onCompleteCalled = true;

                    ctx.result = { a: 3 };
                });
            })
        )
        .up (s => s.args = s.class.Context.new ({ c: true }))
        .returnsInstanceOf ("tasks.MyTask.Context")
        .expectingPropertyToBe ("class.preRunCalled", true)
        .expectingPropertyToBe ("class.postRunCalled", true)
        .expectingPropertyToBe ("class.runCalled", true)
        .expectingPropertyToBe ("class.onCompleteCalled", true)
        .expectingPropertyToBe ("result.c", true)
        .expectingPropertyToBe ("result.result", { a: 3 })
        .commit ()

    .should ("rethrow the exception by default")
        .up (s => s.class = nit.defineTask ("MyTask")
            .onPreRun (function ()
            {
                s.class.preRunCalled = true;
            })
            .onPostRun (function ()
            {
                throw new Error ("POST_RUN_ERROR");
            })
            .onRun (function ()
            {
                s.class.runCalled = true;

                return { a: 1 };
            })
            .configureComponentMethod ("run", Method =>
            {
                Method.afterComplete ((task, ctx) =>
                {
                    s.class.onCompleteCalled = true;

                    ctx.result = { a: 3 };
                });
            })
        )
        .throws ("POST_RUN_ERROR")
        .expectingPropertyToBe ("class.preRunCalled", true)
        .expectingPropertyToBe ("class.runCalled", true)
        .expectingPropertyToBe ("class.onCompleteCalled", true)
        .expectingPropertyToBe ("error.nit\\.Task\\.context.result", { a: 3 })
        .commit ()

    .should ("not throw if ctx.error is deleted")
        .up (s => s.class = nit.defineTask ("MyTask")
            .onPreRun (function ()
            {
                s.class.preRunCalled = true;

                return { a: 1 };
            })
            .onPostRun (function ()
            {
                throw new Error ("POST_RUN_ERROR");
            })
            .configureComponentMethod ("run", Method =>
            {
                Method.beforeFailure (function ()
                {
                    s.class.errorCatched = true;
                    this.error = null;
                });
            })
        )
        .returnsInstanceOf ("tasks.MyTask.Context")
        .expectingPropertyToBe ("result.result", { a: 1 })
        .expectingPropertyToBe ("class.preRunCalled", true)
        .expectingPropertyToBe ("class.errorCatched", true)
        .expectingPropertyToBe ("result.error.message", undefined)
        .commit ()

    .should ("NOT catch the error thrown in onComplete by default")
        .up (s => s.class = nit.defineTask ("MyTask")
            .onPreRun (function ()
            {
                s.class.preRunCalled = true;

                return { b: 1 };
            })
            .onPostRun (function ()
            {
                throw new Error ("POST_RUN_ERROR");
            })
            .configureComponentMethod ("run", Method =>
            {
                Method.afterComplete (function ()
                {
                    s.class.completeCalled = true;
                    nit.throw ("COMPLETE_ERR");
                });
            })
        )
        .mock (nit.log, "e")
        .throws ("POST_RUN_ERROR")
        .expectingPropertyToBe ("class.preRunCalled", true)
        .expectingPropertyToBe ("class.completeCalled", true)
        .expectingPropertyToBeOfType ("error.nit\\.Task\\.context", "tasks.MyTask.Context")
        .commit ()

    .should ("log the event listener error")
        .up (s => s.class = nit.defineTask ("MyTask")
            .onRun (function ()
            {
                return { d: 1 };
            })
            .on ("run", function ()
            {
                throw new Error ("LISTENER_RUN_ERROR");
            })
        )
        .mock (nit.log, "e")
        .expectingPropertyToBe ("result.result", { d: 1 })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0.message", "LISTENER_RUN_ERROR")
        .commit ()

    .should ("be able to run another task via Context.runTask ()")
        .up (s => s.Task1 = nit.defineTask ("MyTask1")
            .field ("<value>", "integer")
            .onRun (function (c)
            {
                return c.task.value * 3;
            })
        )
        .up (s => s.class = nit.defineTask ("MyTask2")
            .onRun (function (c)
            {
                return c.runTask (new s.Task1 (3));
            })
        )
        .expectingPropertyToBe ("result.result", 9)
        .commit ()
;


test.method ("nit.Task", "cancel")
    .should ("stop the task")
        .up (s => s.cancelCount = 0)
        .up (s => s.class = nit.defineTask ("MyTask")
            .onCancel (function ()
            {
                s.class.cancelCalled = true;
            })
            .onPreCancel (function ()
            {
                s.cancelCount++;
            })
            .onPostCancel (function ()
            {
                s.class.postCancelCalled = true;
            })
        )
        .expectingPropertyToBe ("result.canceled", true)
        .expectingPropertyToBe ("cancelCount", 1)
        .expectingPropertyToBe ("class.cancelCalled", true)
        .expectingPropertyToBe ("class.postCancelCalled", true)
        .expectingMethodToReturnValueOfType ("result.cancel", null, "tasks.MyTask")
        .expectingPropertyToBe ("cancelCount", 1)
        .commit ()
;


test.method ("nit", "runTask", true)
    .should ("run the specified task")
        .project ("project-a", true)
        .given ("nit:say-hello", "Me")
        .returns ("Hello Me!")
        .commit ()
;

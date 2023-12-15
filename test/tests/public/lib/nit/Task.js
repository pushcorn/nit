test.object ("nit.Task")
    .should ("represent a runnable task")
        .expectingPropertyToBeOfType ("result.run", Function)
        .expectingPropertyToBeOfType ("result.catch", Function)
        .expectingPropertyToBeOfType ("result.finally", Function)
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
            .onPreFinally (function ()
            {
                s.class.preFinallyCalled = true;

                return { a: 3 };
            })
        )
        .returnsInstanceOf ("tasks.MyTask.Context")
        .expectingPropertyToBe ("class.preRunCalled", true)
        .expectingPropertyToBe ("class.postRunCalled", true)
        .expectingPropertyToBe ("class.runCalled", true)
        .expectingPropertyToBe ("class.preFinallyCalled", true)
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
            .onPreFinally (function ()
            {
                s.class.preFinallyCalled = true;

                return { a: 3 };
            })
        )
        .up (s => s.args = s.class.Context.new ({ c: true }))
        .returnsInstanceOf ("tasks.MyTask.Context")
        .expectingPropertyToBe ("class.preRunCalled", true)
        .expectingPropertyToBe ("class.postRunCalled", true)
        .expectingPropertyToBe ("class.runCalled", true)
        .expectingPropertyToBe ("class.preFinallyCalled", true)
        .expectingPropertyToBe ("result.c", true)
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
            .onPreFinally (function ()
            {
                s.class.preFinallyCalled = true;

                return { a: 3 };
            })
        )
        .throws ("POST_RUN_ERROR")
        .expectingPropertyToBe ("class.preRunCalled", true)
        .expectingPropertyToBe ("class.runCalled", true)
        .expectingPropertyToBe ("class.preFinallyCalled", true)
        .expectingPropertyToBe ("error.nit\\.Task\\.context.result", { a: 3 })
        .commit ()

    .should ("consume the error if onCatch is defined")
        .up (s => s.class = nit.defineTask ("MyTask")
            .onPreRun (function ()
            {
                s.class.preRunCalled = true;
            })
            .onPostRun (function ()
            {
                throw new Error ("POST_RUN_ERROR");
            })
            .onPostFinally (function ()
            {
                s.class.postFinallyCalled = true;
            })
            .onCatch (function ()
            {
                s.class.catchCalled = true;
            })
        )
        .returnsInstanceOf ("tasks.MyTask.Context")
        .expectingPropertyToBe ("class.preRunCalled", true)
        .expectingPropertyToBe ("class.postFinallyCalled", true)
        .expectingPropertyToBe ("result.error.message", undefined)
        .commit ()

    .should ("rethrow the error if thrown in finally")
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
            .onPreFinally (function ()
            {
                throw new Error ("PRE_FINALLY_ERROR");
            })
            .onPostFinally (function ()
            {
                s.class.postFinallyCalled = true;
            })
            .onCatch (function ()
            {
                s.class.catchCalled = true;
            })
        )
        .throws ("PRE_FINALLY_ERROR")
        .expectingPropertyToBe ("class.preRunCalled", true)
        .expectingPropertyToBe ("class.catchCalled", true)
        .expectingPropertyToBe ("class.postFinallyCalled", undefined)
        .expectingPropertyToBe ("error.nit\\.Task\\.context.result", { b: 1 })
        .commit ()

    .should ("rethrow the post-catch error")
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
            .onPostFinally (function ()
            {
                s.class.postFinallyCalled = true;
            })
            .onCatch (function ()
            {
                s.class.catchCalled = true;
            })
            .onPostCatch (function ()
            {
                throw new Error ("POST_CATCH_ERROR");
            })
        )
        .throws ("POST_CATCH_ERROR")
        .expectingPropertyToBe ("class.preRunCalled", true)
        .expectingPropertyToBe ("class.catchCalled", true)
        .expectingPropertyToBe ("class.postFinallyCalled", true)
        .expectingPropertyToBe ("error.nit\\.Task\\.context.result", { b: 1 })
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
        .mock ("object", "error")
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

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


test.method ("nit.Task", "execute")
    .should ("invoke the run and hook methods")
        .up (s => s.class = nit.defineTask ("MyTask")
            .onPreRun (function ()
            {
                s.preRunCalled = true;
            })
            .onPostRun (function ()
            {
                s.postRunCalled = true;
            })
            .onRun (function ()
            {
                s.runCalled = true;

                return { a: 1 };
            })
            .onPreFinally (function ()
            {
                s.preFinallyCalled = true;
            })
            .onPostFinally (function ()
            {
                s.postFinallyCalled = true;
            })
            .onFinally (function ()
            {
                s.finallyCalled = true;
            })
        )
        .returnsInstanceOf ("tasks.MyTask.Context")
        .expectingPropertyToBe ("result.result", { a: 1 })
        .expectingPropertyToBe ("preRunCalled", true)
        .expectingPropertyToBe ("postRunCalled", true)
        .expectingPropertyToBe ("runCalled", true)
        .expectingPropertyToBe ("preFinallyCalled", true)
        .expectingPropertyToBe ("postFinallyCalled", true)
        .expectingPropertyToBe ("finallyCalled", true)
        .commit ()

    .should ("throw if one of the lifecycle method throws")
        .up (s => s.class = nit.defineTask ("MyTask")
            .onPostRun (function ()
            {
                throw new Error ("POST-RUN");
            })
            .onRun (function ()
            {
                return { a: 1 };
            })
            .onCatch (function (ctx)
            {
                s.catchError = ctx.error;
            })
            .onPostCatch (function ()
            {
                throw new Error ("POST-CATCH");
            })
            .onFinally (function (ctx)
            {
                s.finalResult = ctx.result;
                s.finalError = ctx.error;
            })
        )
        .up (s => s.args = s.class.Context ())
        .throws ("POST-CATCH")
        .expectingPropertyToBe ("args.0.result", { a: 1 })
        .expectingPropertyToBe ("args.0.error.message", "POST-CATCH")
        .expectingPropertyToBe ("catchError.message", "POST-RUN")
        .expectingPropertyToBe ("finalResult", { a: 1 })
        .expectingPropertyToBe ("finalError.message", "POST-CATCH")
        .commit ()

    .should ("throw if the finally hook throws")
        .up (s => s.class = nit.defineTask ("MyTask")
            .onPostRun (function ()
            {
                throw new Error ("POST-RUN");
            })
            .onRun (function ()
            {
                return { a: 1 };
            })
            .onCatch (function (ctx)
            {
                s.catchError = ctx.error;
            })
            .onPostCatch (function ()
            {
                throw new Error ("POST-CATCH");
            })
            .onFinally (function (ctx)
            {
                s.finalResult = ctx.result;
                s.finalError = ctx.error;
                throw new Error ("FINALLY");
            })
        )
        .up (s => s.args = s.class.Context ())
        .throws ("FINALLY")
        .expectingPropertyToBe ("args.0.result", { a: 1 })
        .expectingPropertyToBe ("args.0.error.message", "FINALLY")
        .expectingPropertyToBe ("catchError.message", "POST-RUN")
        .expectingPropertyToBe ("finalResult", { a: 1 })
        .expectingPropertyToBe ("finalError.message", "POST-CATCH")
        .commit ()

    .should ("throw if the catch hook was not implemented")
        .up (s => s.class = nit.defineTask ("MyTask")
            .onPostRun (function ()
            {
                throw new Error ("POST-RUN");
            })
            .onRun (function ()
            {
                return { a: 1 };
            })
            .onFinally (function (ctx)
            {
                s.finalResult = ctx.result;
                s.finalError = ctx.error;
            })
        )
        .up (s => s.args = s.class.Context ())
        .throws ("POST-RUN")
        .expectingPropertyToBe ("args.0.result", { a: 1 })
        .expectingPropertyToBe ("args.0.error.message", "POST-RUN")
        .expectingPropertyToBe ("finalResult", { a: 1 })
        .expectingPropertyToBe ("finalError.message", "POST-RUN")
        .commit ()

    .should ("clear the error if the catch hook is implemented")
        .up (s => s.class = nit.defineTask ("MyTask")
            .onPostRun (function ()
            {
                throw new Error ("POST-RUN");
            })
            .onRun (function ()
            {
                return { a: 1 };
            })
            .onCatch (function (ctx)
            {
                s.catchError = ctx.error;
            })
            .onFinally (function (ctx)
            {
                s.finalResult = ctx.result;
                s.finalError = ctx.error;
            })
        )
        .up (s => s.args = s.class.Context ())
        .expectingPropertyToBe ("result.result", { a: 1 })
        .expectingPropertyToBe ("args.0.result", { a: 1 })
        .expectingPropertyToBe ("args.0.error", undefined)
        .expectingPropertyToBe ("catchError.message", "POST-RUN")
        .expectingPropertyToBe ("finalResult", { a: 1 })
        .expectingPropertyToBe ("finalError", undefined)
        .commit ()
;

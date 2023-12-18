test.plugin ("plugins.TaskQueue", "defineTask", true)
    .should ("define an internal task")
        .given ("Run")
        .expectingPropertyToBeOfType ("hostClass.Run", "test.PluginHost.Task", true)
        .expectingPropertyToBe ("hostClass.Run.priority", 100)
        .commit ()
;


test.plugin ("plugins.TaskQueue", "defineTaskMethod", true)
    .should ("define a method that runs a task")
        .given ("addOne", Task => Task
            .field ("<value>", "integer")
            .onRun (ctx => ctx.task.value + 1)
        )
        .after (s => s.hostClass.defineTaskMethod ("addTwo", Task => Task
            .onRun (function ()
            {
                throw new Error ("ERR");
            })
        ))
        .after (s => s.host = new s.hostClass)
        .expectingPropertyToBeOfType ("hostClass.AddOneTask", "test.PluginHost.Task", true)
        .expectingMethodToReturnValue ("host.addOne", 100, 101)
        .expectingMethodToThrow ("host.addTwo", null, "ERR")
        .commit ()
;


test.plugin ("plugins.TaskQueue", "defineQueuedTaskMethod", true, { hostClass: "test.PluginHost3" })
    .should ("define a method that queues a task")
        .up (s => s.args =
        [
            "fetchDoc",
            Task => Task
                .field ("<url>", "string")
                .onRun (async (ctx) =>
                {
                    s.def = new nit.Deferred;

                    await s.def;

                    return s.result = ("fetched " + ctx.task.url);
                })
        ])
        .after (s => s.host = new s.hostClass)
        .after (s => s.host.fetchDoc ("http://pushcorn.com"))
        .after (s => setTimeout (() => s.def.resolve (), 50))
        .after (s => s.def)
        .expectingPropertyToBeOfType ("hostClass.FetchDocTask", "test.PluginHost3.Task", true)
        .expectingPropertyToBe ("result", "fetched http://pushcorn.com")
        .commit ()
;

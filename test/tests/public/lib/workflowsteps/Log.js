nit.require ("nit.Workflow");


test.method ("workflowsteps.Log", "run")
    .should ("print a message to the console")
        .given ({ input: "hello" })
        .mock (nit, "log")
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "hello")
        .commit ()

    .should ("log the info message if level is info")
        .up (s => s.createArgs = ["The message: %{input}", "info"])
        .given ({ input: "hello" })
        .mock (nit, "log")
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "[INFO] The message: hello")
        .commit ()

    .should ("log the error message if level is error")
        .up (s => s.createArgs = ["The message: %{input}", "error"])
        .given ({ input: "hello" })
        .mock (nit, "log")
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "[ERROR] The message: hello")
        .commit ()

    .should ("log the message with the timestamp if timestamp is true")
        .up (s => s.createArgs = ["The message: %{input}", "error", true])
        .given ({ input: "hello" })
        .mock (nit, "log")
        .returnsInstanceOf ("nit.Workflow.Subcontext")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[ERROR\] The message: hello/)
        .commit ()
;
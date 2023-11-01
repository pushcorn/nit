nit.require ("nit.Workflow");


test.method ("workflowsteps.Eval", "run")
    .should ("should evaluate the specified statements")
        .up (s => s.createArgs =
        [
            "let a = 3;",
            "let b = 4;",
            "if (a < 4)",
            "{",
            "   return (ctx.r = a * b);",
            "}",
            "else",
            "{",
            "   return (ctx.r = a + b);",
            "}"
        ])
        .given (new nit.Workflow.Context)
        .expectingPropertyToBe ("result.output", 12)
        .commit ()
;

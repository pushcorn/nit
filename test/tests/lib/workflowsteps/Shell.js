nit.require ("nit.Workflow");


test.method ("workflowsteps.Shell", "run")
    .should ("run a shell command")
        .up (s => s.createArgs = "/bin/echo -n 'hello world!'")
        .given (new nit.Workflow.Context)
        .expectingPropertyToBe ("result.output", "hello world!")
        .commit ()

    .should ("throw if the command failed")
        .up (s => s.createArgs = "tar ijk")
        .given (new nit.Workflow.Context)
        .throws ("error.shell_error")
        .commit ()

    .reset ()
        .up (s => s.createArgs = "echo 'err' && false")
        .given (new nit.Workflow.Context)
        .throws (/echo.*err.*false/)
        .commit ()
;

/* eslint-disable  no-template-curly-in-string */

nit.require ("nit.Workflow");


test.method ("workflowsteps.Workflow", "run")
    .should ("run a workflow class")
        .up (() => nit.defineWorkflow ("test.workflows.FlowTest")
            .configure (
            {
                options:
                [
                {
                    spec: "tag",
                    type: "string"
                }
                ]
                ,
                steps:
                [
                {
                    type: "log",
                    message: "${'flow test! ' + options.tag}"
                }
                ,
                {
                    type: "return",
                    value:
                    {
                        tag: "${options.tag + '-mod'}"
                    }
                }
                ]
            })
        )
        .up (s => s.createArgs = "test:flow-test")
        .mock (nit, "log")
        .given ({ input: { tag: "WF" } })
        .expectingPropertyToBe ("result.output", { tag: "WF-mod" })
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "flow test! WF")
        .commit ()

    .should ("run a workflow file")
        .project ("project-a")
        .up (s => s.createArgs = "nit:echo-test")
        .mock (nit, "log")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "test 1")
        .expectingPropertyToBe ("mocks.0.invocations.1.args.0", /^\d{4}.*test 2 false$/)
        .commit ()

    .should ("be able to run an arbitrary workflow file")
        .up (s => s.createArgs = nit.path.join (test.TEST_PROJECT_PATH, "resources/home/workflows/random.json"))
        .expectingPropertyToBe ("result.output", /^\d\.\d+$/)
        .commit ()

    .should ("throw if the workflow file was not found")
        .up (s => s.createArgs = nit.path.join (test.TEST_PROJECT_PATH, "resources/home/workflows/random2.json"))
        .throws ("error.workflow_not_found")
        .commit ()
;

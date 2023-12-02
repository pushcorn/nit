test.method ("nit.Workflow.compgencompleters.Completer", "generate", true)
    .should ("generate the workflow names")
        .project ("project-a", true)
        .given (
        {
            completionType: "type",
            currentOption:
            {
                type: "workflow"
            }
            ,
            filterCompletions: t => t
        })
        .returns (["VALUE", "nit:log-message", "nit:echo-test"])
        .commit ()
;


test.method ("nit.Workflow", "lookup", true)
    .should ("return the workflow class if the file is found")
        .project ("project-a", true)
        .given ("nit:echo-test")
        .returnsInstanceOf ("nit.Workflow", true)
        .commit ()

    .should ("accept the abs path of the workflow")
        .project ("project-a", true)
        .before (s => s.args = nit.resolveAsset ("lib/nit/workflows/LogMessage.js"))
        .expectingPropertyToBe ("result.name", "workflows.LogMessage")
        .commit ()

    .should ("throw if the workflow is not found")
        .project ("project-a", true)
        .given ("nit:test2")
        .throws ("error.workflow_not_found")
        .commit ()
;

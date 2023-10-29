module.exports = function (nit, Self)
{
    return (Self = nit.defineWorkflowStep ("Continue"))
        .onRun (function ()
        {
            return Self.Workflow.CONTROLS.Continue;
        })
    ;
};

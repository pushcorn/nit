module.exports = function (nit, Self)
{
    return (Self = nit.defineWorkflowStep ("Break"))
        .onRun (function ()
        {
            return Self.Workflow.CONTROLS.Break;
        })
    ;
};

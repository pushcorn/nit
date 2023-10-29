module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Noop")
        .onRun (function () {})
    ;
};

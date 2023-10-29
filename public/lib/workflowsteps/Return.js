module.exports = function (nit, Self)
{
    return (Self = nit.defineWorkflowStep ("Return"))
        .field ("[value]", "any", "The value to be returned.", "${input}", { exprAllowed: true }) // eslint-disable-line no-template-curly-in-string
        .onRun (function ()
        {
            return new Self.Workflow.Return ({ value: this.value });
        })
    ;
};

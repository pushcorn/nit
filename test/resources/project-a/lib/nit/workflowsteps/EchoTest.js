module.exports = function (nit)
{
    return nit.defineWorkflowStep ("nit.workflowsteps.EchoTest")
        .field ("<message>", "any", "The message to be echoed.", "%{input}", { exprAllowed: true }) // eslint-disable-line no-template-curly-in-string

        .onRun (function (ctx)
        {
            nit.log (nit.format (this.message, ctx));
        })
    ;
};

module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Subroutine")
        .field ("<name>", "string", "The subroutine name to be called.", { exprAllowed: true })
        .field ("input", "any", "The input options.", { exprAllowed: true })
        .onRun (function (ctx)
        {
            var self = this;
            var subroutine = ctx.workflow.lookupSubroutine (self.name);

            ctx.output = nit.coalesce (self.input, ctx.input);

            return subroutine.run (ctx);
        })
    ;
};

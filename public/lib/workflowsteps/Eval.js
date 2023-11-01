module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Eval")
        .field ("<statements...>", "string", "The statements to be evaluated.")
        .memo ("func", function ()
        {
            return nit.createFunction ("evaluate", "\n" + this.statements.join ("\n") + "\n", ["ctx"]);
        })
        .onRun (function (ctx)
        {
            return this.func (ctx);
        })
    ;
};

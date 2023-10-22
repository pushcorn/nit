module.exports = function (nit)
{
    return nit.test.defineStrategy ("CompgenCompleter")
        .require ("nit.Compgen")
        .field ("<completer>", "string", "The compgen completer to test.")

        .property ("class", "function")
        .property ("context", "nit.Compgen.Context")

        .onConstruct (function (completer)
        {
            let cls = nit.lookupClass (completer);

            this.class = cls;
            this.description = this.description || `Compgen Completer: ${cls.name}`;
        })
        .onTestUp (function ()
        {
            this.context = new nit.Compgen.Context (...arguments);
        })
        .onTest (function ()
        {
            return this.class.generate (this.context);
        })
    ;
};

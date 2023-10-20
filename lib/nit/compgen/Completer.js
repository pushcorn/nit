module.exports = function (nit)
{
    return nit.defineClass ("nit.compgen.Completer") // TODO: rename to CompgenCompleter
        .categorize ("nit.compgen.completers")
        .defineMeta ("order", "integer", 10) // The invocation order.
        .staticLifecycleMethod ("completeForRedirect", null, function (ctx) {}) // eslint-disable-line no-unused-vars
        .staticLifecycleMethod ("completeForType", null, function (ctx) {}) // eslint-disable-line no-unused-vars
        .staticLifecycleMethod ("completeForConstraint", null, function (ctx) {}) // eslint-disable-line no-unused-vars
    ;
};

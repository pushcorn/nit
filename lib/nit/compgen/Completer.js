module.exports = function (nit)
{
    return nit.defineClass ("nit.compgen.Completer")
        .categorize ("nit.compgen.completers")
        .field ("order", "integer", "The invocation order.", 10)
        .method ("completeForRedirect", function (ctx) {}) // eslint-disable-line no-unused-vars
        .method ("completeForType", function (ctx) {}) // eslint-disable-line no-unused-vars
        .method ("completeForConstraint", function (ctx) {}) // eslint-disable-line no-unused-vars
    ;
};

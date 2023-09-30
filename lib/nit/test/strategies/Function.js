module.exports = function (nit)
{
    return nit.test.defineStrategy ("Function")
        .field ("<func>", "function", "The function to test.")
        .onConstruct (function (func)
        {
            this.description = this.description || `Function: ${func.name}`;
        })
        .onTest (function ()
        {
            return this.func (...arguments);
        })
    ;
};

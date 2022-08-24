module.exports = function (nit)
{
    return nit.test.defineStrategy ("nit.test.strategies.Function")
        .field ("<func>", "function", "The function to test.")
        .construct (function (func)
        {
            this.description = this.description || `Function: ${func.name}`;
        })
        .test (function ()
        {
            return this.func (...arguments);
        })
    ;
};

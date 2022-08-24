module.exports = function (nit)
{
    return nit.test.defineStrategy ("nit.test.strategies.Method")
        .field ("<object>", "any", "The host object.")
            .constraint ("type", "object", "function")
        .field ("<method>", "string", "The method name.")

        .construct (function (object, method)
        {
            let cls = nit.is.obj (object) ? object.constructor : object;

            this.description = this.description || `Method: ${cls.name}.${method} ()`;
        })
        .test (function ()
        {
            return this.object[this.method] (...arguments);
        })
    ;
};

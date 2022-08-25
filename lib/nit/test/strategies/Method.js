module.exports = function (nit)
{
    return nit.test.defineStrategy ("nit.test.strategies.Method")
        .field ("<object>", "any", "The host object.")
            .constraint ("type", "string", "object", "function")
        .field ("<method>", "string", "The method name.")
        .field ("[isStatic]", "boolean", "Whether the method is a static one.")

        .construct (function (object, method, isStatic)
        {
            let cls = nit.is.str (object) ? nit.lookupClass (object) : (nit.is.obj (object) ? object.constructor : object);

            if (isStatic || nit.is.func (object))
            {
                this.object = cls;
            }
            else
            {
                this.object = nit.is.obj (object) ? object : new cls;
            }

            this.description = this.description || `Method: ${cls.name}.${method} ()`;
        })
        .test (function ()
        {
            return this.object[this.method] (...arguments);
        })
    ;
};

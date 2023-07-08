module.exports = function (nit)
{
    return nit.test.defineStrategy ("nit.test.strategies.Method")
        .field ("<object>", "any", "The host object.")
            .constraint ("type", "string", "object", "function")
        .field ("<method>", "string", "The method name.")
        .field ("[isStatic]", "boolean", "Whether the method is a static one.")
        .field ("recreate", "boolean?", "Whether to create a new instance on test.")
        .field ("createArgs...", "any", "The constructor args if the object will be created.")

        .property ("class", "function")

        .onConstruct (function (object, method)
        {
            let cls = nit.is.str (object) ? nit.lookupClass (object) : (nit.is.obj (object) ? object.constructor : object);

            this.class = cls;
            this.recreate = nit.is.bool (this.recreate) ? this.recreate : !nit.is.obj (object);
            this.description = this.description || `Method: ${cls.name}.${method} ()`;
        })
        .onTestUp (async function ()
        {
            if (this.isStatic)
            {
                this.object = this.class;
            }
            else
            if (this.recreate)
            {
                this.object = await (new this.class (...this.createArgs));
            }
        })
        .onTest (function ()
        {
            return this.object[this.method] (...arguments);
        })
    ;
};

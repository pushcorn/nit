module.exports = function (nit)
{
    return nit.test.defineStrategy ("Method")
        .field ("<object>", "string|object|function", "The host object.")
        .field ("<method>", "string", "The method name.")
        .field ("[isStatic]", "boolean", "Whether the method is a static one.")
        .field ("recreate", "boolean?", "Whether to create a new instance on test.")
        .field ("createArgs...", "any", "The constructor args if the object will be created.")

        .property ("class", "function")
        .property ("pObject", "any")

        .onConstruct (function (object, method)
        {
            let clsName = nit.is.str (object) ? object : nit.getClass (object).name;

            this.pObject = object;
            this.recreate = nit.is.bool (this.recreate) ? this.recreate : !nit.is.obj (object);
            this.description = this.description || `Method: ${clsName}.${method} ()`;
        })
        .onTestInit (function ()
        {
            let { pObject } = this;

            this.class = nit.is.str (pObject) ? nit.lookupClass (pObject) : nit.getClass (pObject);
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

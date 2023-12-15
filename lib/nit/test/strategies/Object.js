module.exports = function (nit)
{
    return nit.test.defineStrategy ("Object")
        .field ("<object>", "string|object|function", "The object to be tested.")
        .field ("[recreate]", "boolean?", "Whether to create a new instance on test.")
        .field ("[property]", "string", "The property to use as the result.")

        .property ("class", "function")
        .property ("instance", "any")

        .onConstruct (function (object)
        {
            if (nit.is.str (object))
            {
                this.class = nit.lookupClass (object);
            }
            else
            if (nit.is.func (object))
            {
                this.class = object;
            }
            else
            {
                this.class = object.constructor;
            }

            this.description = this.description || `${this.property ? "Property" : "Object"}: ${this.class.name}${this.property ? "." + this.property : ""}`;
        })
        .onTestUp (async function ()
        {
            this.instance = await ((this.recreate || (this.recreate !== false && nit.is.str (this.object))) ? new this.class (...arguments) : this.object);
        })
        .onTest (async function ()
        {
            return this.property ? nit.get (this.instance, this.property) : this.instance;
        })
    ;
};

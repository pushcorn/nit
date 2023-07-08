module.exports = function (nit)
{
    return nit.test.defineStrategy ("nit.test.strategies.Object")
        .field ("<object>", "any", "The object to be tested.")
            .constraint ("type", "string", "object", "function")
        .field ("[recreate]", "boolean?", "Whether to create a new instance on test.")
        .field ("[property]", "string", "The property to use as the result.")

        .property ("class", "function")

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
        .onTest (async function ()
        {
            let result = await ((this.recreate || (this.recreate !== false && nit.is.str (this.object))) ? new this.class (...arguments) : this.object);

            return this.property ? nit.get (result, this.property) : result;
        })
    ;
};

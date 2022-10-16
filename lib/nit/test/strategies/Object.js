module.exports = function (nit)
{
    return nit.test.defineStrategy ("nit.test.strategies.Object")
        .field ("<object>", "any", "The object to be tested.")
            .constraint ("type", "string", "object", "function")
        .field ("[recreate]", "boolean", "Whether to create a new instance on test.")

        .property ("class", "function")

        .construct (function (object)
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

            this.description = this.description || `Object: ${this.class.name}`;
        })
        .test (async function ()
        {
            return await ((this.recreate || nit.is.str (this.object)) ? new this.class (...arguments) : this.object);
        })
    ;
};

module.exports = function (nit)
{
    return nit.test.defineStrategy ("nit.test.strategies.Object")
        .field ("<object>", "any", "The object to be tested.")
            .constraint ("type", "string", "object", "function")

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
        .test (function ()
        {
            return nit.is.obj (this.object) ? this.object : new this.class (...arguments);
        })
    ;
};

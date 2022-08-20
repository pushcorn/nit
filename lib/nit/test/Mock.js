module.exports = function (nit, Self)
{
    // A mock class that can be used to create mock objects that
    // tracks method invocations.

    return (Self = nit.defineClass ("nit.test.Mock"))
        .categorize ()
        .k ("invocations")
        .staticMethod ("method", function (name, method)
        {
            if (!nit.is.func (method))
            {
                let value = method;

                method = function () { return value; };
            }

            let wrapper = nit.extend (function ()
            {
                let args = nit.array (arguments);
                let self = this;

                return nit.Queue ()
                    .push (function ()
                    {
                        return method.apply (self, args);
                    })
                    .run (function (ctx)
                    {
                        wrapper.invocations.push (
                        {
                            this: nit.clone (self),
                            args,
                            result: ctx.result
                        });
                    })
                ;

            }, nit.Object);

            wrapper.staticProperty ("invocations...", "object", "The details for each invocation.");

            wrapper.staticMethod ("reset", function ()
            {
                this.invocations = [];
            });

            return Self.superclass.method.call (this, name, wrapper);
        })
    ;
};

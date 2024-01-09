module.exports = function (nit, Self)
{
    // A mock class that can be used to create mock objects that
    // tracks method invocations.

    return (Self = nit.defineClass ("nit.test.Mock"))
        .categorize ()
        .defineInnerClass ("Invocation", Invocation =>
        {
            Invocation
                .field ("snapshot", "object", "The snapshot of the mock object when the method was invoked.")
                .field ("args...", "any", "The arguments of the invocation.")
                .field ("result", "any", "The invocation result.")
            ;
        })
        .registerInnerClass ("Method", nit.extend (nit.createFunction ("nit.test.Mock.Method", "return nit_test_Mock_Method.invoke (this, arguments);"), nit.Class)
            .staticProperty ("impl", "function") // "The method implementation."
            .staticProperty ("invocations...", "nit.test.Mock.Invocation") // "The details for each invocation."
            .staticMethod ("reset", function ()
            {
                this.invocations = [];
            })
            .staticMethod ("invoke", function (obj, args)
            {
                let self = this;

                args = nit.array (args);

                return nit.invoke.after (() => self.impl?.apply (obj, args), [], (error, result) =>
                {
                    self.invocations.push (
                    {
                        snapshot: nit.clone (obj),
                        args,
                        result
                    });
                });
            })
        )
        .staticMethod ("reset", function ()
        {
            nit.each (nit.keys (this.prototype, true), (k) =>
            {
                let prop = this.prototype[k];

                if (nit.is.func (prop) && nit.is.subclassOf (prop, Self.Method))
                {
                    prop.reset ();
                }
            });
        })
        .staticMethod ("method", function (name, impl)
        {
            let cn = nit.pascalCase (name);
            let Method = Self.Method.defineSubclass (
                cn,
                `return ${cn}.invoke (this, arguments);`,
                true
            );

            Method.impl = nit.is.func (impl) ? impl : function () { return impl; };

            return Self.superclass.method.call (this, name, Method);
        })
    ;
};

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
        .defineInnerClass ("Method", Method =>
        {
            Method
                .staticProperty ("impl", "function", "The method implementation.")
                .staticProperty ("invocations...", "nit.test.Mock.Invocation", "The details for each invocation.")
                .staticMethod ("reset", function ()
                {
                    this.invocations = [];
                })
                .staticMethod ("constructObject", function (obj, args, that)
                {
                    let self = this;

                    return nit.Queue ()
                        .push (function ()
                        {
                            return self.impl && self.impl.apply (that, args);
                        })
                        .complete (function (ctx)
                        {
                            self.invocations.push (
                            {
                                snapshot: nit.clone (that),
                                args,
                                result: ctx.result
                            });
                        })
                        .run ()
                    ;
                })
            ;
        })
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
            let Method = Self.Method.defineSubclass (nit.pascalCase (name), true);

            Method.impl = nit.is.func (impl) ? impl : function () { return impl; };

            return Self.superclass.method.call (this, name, Method);
        })
    ;
};

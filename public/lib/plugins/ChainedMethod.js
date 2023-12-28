module.exports = function (nit)
{
    return nit.definePlugin ("ChainedMethod")
        .onUsedBy (function (hostClass)
        {
            hostClass
                .defineInnerClass ("ChainedMethod", function (ChainedMethod)
                {
                    ChainedMethod
                        .plugin ("call-chains")
                        .field ("<owner>", "object|function")
                        .method ("invoke", function ()
                        {
                            var self = this;
                            var cls = self.constructor;

                            return nit.invoke.return ([cls.chains.fork (self.owner), "invoke"], arguments, function (ctx)
                            {
                                if (ctx.error)
                                {
                                    throw ctx.error;
                                }

                                return ctx.result;
                            });
                        })
                    ;
                })
                .staticTypedMethod ("defineChainedMethod",
                    {
                        isStatic: "boolean", name: "string", safe: "boolean", builder: "function"
                    },
                    function (isStatic, name, safe, builder)
                    {
                        var cls = this;
                        var methodClassName = nit.ucFirst (name) + "ChainedMethod";

                        cls.defineInnerClass (methodClassName, cls.ChainedMethod.name, function (mc)
                        {
                            mc.addChain (name, safe, function (chain)
                            {
                                chain.after (name + ".invokeHook", function (owner)
                                {
                                    var ctx = this;
                                    var cls = nit.getClass (owner);
                                    var kHook = cls["k" + nit.ucFirst (name)];

                                    return nit.invoke ([owner, cls[kHook]], ctx.args);
                                });
                            });

                            nit.invoke ([cls, builder], mc);
                        });

                        hostClass.onDefineSubclass (function (subclass)
                        {
                            subclass.subclassChainedMethod (name);
                        });

                        return cls[isStatic ? "staticLifecycleMethod" : "lifecycleMethod"] (name, function ()
                        {
                            var self = this;
                            var cls = nit.getClass (self);
                            var method = new cls[methodClassName] (self);

                            return method.invoke.apply (method, arguments);
                        });
                    }
                )
                .staticMethod ("staticChainedMethod", function (name, safe, builder)
                {
                    return this.defineChainedMethod (true, name, safe, builder);
                })
                .staticMethod ("chainedMethod", function (name, safe, builder)
                {
                    return this.defineChainedMethod (false, name, safe, builder);
                })
                .staticMethod ("subclassChainedMethod", function (name, builder)
                {
                    var cls = this;
                    var methodClassName = nit.ucFirst (name) + "ChainedMethod";
                    var smc = cls.superclass[methodClassName];

                    return cls.defineInnerClass (methodClassName, smc.name, function (sub)
                    {
                        nit.invoke ([cls, builder], sub);
                    });
                })
            ;
        })
    ;
};

module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("CallChains"))
        .field ("[names...]", "string", "The chains to be created.")
        .defineInnerClass ("Chains", function (Chains)
        {
            Chains
                .defineMeta ("entry", "string")
                .defineInnerClass ("Link", function (Link)
                {
                    Link
                        .field ("<from>", "string")
                        .field ("<to>", "string")
                        .field ("[condition]", "function")
                        .method ("apply", function (chains)
                        {
                            var self = this;

                            chains[self.from].link (chains[self.to], self.condition);
                        })
                    ;
                })
                .defineInnerClass ("Context", "nit.CallChain.Context", function (Context)
                {
                    Context
                        .field ("chains", Chains.name)
                        .delegate ("owner", "chains.owner")
                    ;
                })
                .staticProperty ("links...", Chains.Link.name)
                .staticMethod ("link", function ()
                {
                    this.links.push (nit.new (Chains.Link, arguments));

                    return this;
                })
                .field ("owner", "any")
                .method ("fork", function (owner)
                {
                    var self = this;
                    var cls = self.constructor;
                    var params = {};

                    cls.fields.forEach (function (f)
                    {
                        if (f.type == "nit.CallChain")
                        {
                            params[f.name] = self[f.name].fork (owner);
                        }
                    });

                    var chains = new cls (params);

                    chains.owner = owner;

                    return chains;
                })
                .method ("invoke", function (ctx)
                {
                    var self = this;
                    var cls = self.constructor;

                    ctx = ctx instanceof cls.Context ? ctx : nit.new (cls.Context, { args: arguments });
                    ctx.chains = self;

                    cls.links.forEach (function (l) { l.apply (self); });

                    return self[cls.entry].invoke (ctx);
                })
            ;
        })
        .onUsedBy (function (hostClass)
        {
            var plugin = this;

            hostClass
                .defineInnerClass ("Chains", Self.Chains.name)
                .onDefineSubclass (function (Subclass)
                {
                    Subclass.defineInnerClass ("Chains", this.Chains.name);
                    Subclass.staticProperty ("chains", Subclass.Chains.name, { defval: {} });
                    Subclass.Chains.links = this.Chains.links;
                    Subclass.chains = this.chains.fork ().toPojo (true);
                })
                .staticProperty ("chains", hostClass.name + ".Chains", { defval: {} })
                .staticMethod ("link", function ()
                {
                    var cls = this;
                    var Chains = cls.Chains;

                    Chains.link.apply (Chains, arguments);

                    return cls;
                })
                .staticMethod ("addChain", function (chainName, safe, builder)
                {
                    var cls = this;
                    var ucName = nit.ucFirst (chainName);
                    var Chains = cls.Chains;
                    var chain = nit.CallChain (chainName, { name: chainName, safe: safe });

                    nit.invoke ([cls, builder], chain);

                    Chains
                        .meta ("entry", Chains.entry || chainName)
                        .field (chainName, "nit.CallChain", "The " + chainName + " chain.", chain)
                    ;

                    ["before", "after", "replace"].forEach (function (order)
                    {
                        var method = order + ucName;

                        Chains.method (method, function ()
                        {
                            return nit.invoke.return ([this[chainName], order], arguments, this);
                        });

                        Chains.Context.method (method, function ()
                        {
                            return nit.invoke.return ([this.chains, method], arguments, this);
                        });

                        cls.staticMethod (method, function ()
                        {
                            nit.invoke ([this.chains, method], arguments);

                            return this;
                        });
                    });

                    return cls;
                })
                .staticMethod ("invoke", function ()
                {
                    return nit.invoke ([this.chains.fork (), "invoke"], arguments);
                })
                .do (function ()
                {
                    ["until", "before", "after", "replace"].forEach (function (method)
                    {
                        hostClass.staticMethod (method, function ()
                        {
                            var cls = this;

                            nit.invoke ([cls.chains[cls.Chains.entry], method], arguments);

                            return cls;
                        });
                    });

                    plugin.names.forEach (function (name) { hostClass.addChain (name); });
                })
            ;
        })
    ;
};

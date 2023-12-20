module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Context"))
        .m ("error.service_not_registered", "The service '%{type}' was not registered.")
        .staticMethod ("new", function ()
        {
            var cls = this;
            var args = nit.argsToObj (arguments);
            var pargs = nit.each (args, function (v, k)
            {
                if (nit.is.int (k))
                {
                    delete args[k];
                    return v;
                }
                else
                {
                    return nit.each.SKIP;
                }
            });

            var opts = nit.pick (args, cls.propertyNames);
            var data = nit.omit (args, cls.propertyNames);

            return nit.assign (nit.new (cls, pargs.concat (opts)), data);
        })
        .property ("serviceRegistry", "object",
        {
            enumerable: false,
            setter: function (v)
            {
                if (this.parent)
                {
                    this.parent.serviceRegistry = v;
                }
                else
                {
                    return v;
                }
            }
            ,
            getter: function (v)
            {
                if (this.parent)
                {
                   return this.parent.serviceRegistry;
                }
                else
                {
                    return v;
                }
            }
        })
        .method ("registerServiceProvider", function (service, provider)
        {
            var self = this;

            nit.memoize.dpg (self.serviceRegistry, service, true, true, function ()
            {
                return provider (self);
            });

            return self;
        })
        .method ("registerService", function (service)
        {
            this.serviceRegistry[service.constructor.name] = service;

            return this;
        })
        .method ("lookupService", function (serviceType, optional)
        {
            serviceType = nit.lookupClass (serviceType, !optional);

            var service = nit.find (this.serviceRegistry, function (s) { return s instanceof serviceType; });

            if (!service && !optional)
            {
                this.throw ("error.service_not_registered", { type: serviceType.name });
            }

            return service;
        })
        .method ("delegateParentProperties", function ()
        {
            var self = this;
            var myProps = nit.propertyDescriptors (self, true);

            nit.each (nit.propertyDescriptors (self.parent, true), function (p, name)
            {
                if (!~name.indexOf (nit.PPP) && !myProps[name])
                {
                    nit.Object.defineDelegate (self, name, "parent." + nit.get.escape (name), p.configurable, false);
                }
            });

            return self;
        })
        .field ("parent", Self.name, "The parent context.",
        {
            onLink: function ()
            {
                this.delegateParentProperties ();
            }
        })
        .getter ("root", false, false, function ()
        {
            var p = this;

            while (p.parent)
            {
                p = p.parent;
            }

            return p;
        })
    ;
};

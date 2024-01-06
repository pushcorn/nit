module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Context"))
        .m ("error.service_not_registered", "The service '%{type}' was not registered.")
        .registerPlugin ("nit.ServiceProvider", true, true)
        .plugin ("event-emitter", "destroy")
        .defineInnerClass ("ServiceEntry", function (ServiceEntry)
        {
            ServiceEntry
                .field ("<service>", "object")
                .field ("[destroy]", "function")
            ;
        })
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
        .staticLifecycleMethod ("suppressedContextError", null, function (error) { nit.log.e (error); })
        .property ("objectRegistry", "object",
        {
            enumerable: false,
            setter: function (v)
            {
                if (this.parent)
                {
                    this.parent.objectRegistry = v;
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
                   return this.parent.objectRegistry;
                }
                else
                {
                    return v;
                }
            }
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
        .method ("registerService", function (service, destroy)
        {
            this.serviceRegistry[service.constructor.name] = new Self.ServiceEntry (service, destroy);

            return this;
        })
        .method ("lookupService", function (serviceType, optional)
        {
            if (!(serviceType = nit.lookupClass (serviceType, !optional)))
            {
                return;
            }

            var serviceName = serviceType.name;
            var self = this;
            var parent = self.parent;
            var service = nit.find.result (self.serviceRegistry, function (s) { return s.service instanceof serviceType ? s.service : undefined; });
            var provider;

            if (!service
                && !(provider = self.lookupServiceProvider (serviceType))
                && parent)
            {
                provider = parent.lookupServiceProvider (serviceType);
            }

            if (!service)
            {
                if (provider)
                {
                    service = provider.create (serviceName, self);

                    self.registerService (service, provider.destroy.bind (provider));
                }
                else
                if (!optional)
                {
                    self.throw ("error.service_not_registered", { type: serviceName });
                }
            }

            return service;
        })
        .method ("getObjectRegistryEntries", function (type)
        {
            var reg = this.objectRegistry;

            if (!reg[type])
            {
                reg[type] = [];
            }

            return reg[type];
        })
        .method ("registerObject", function (object)
        {
            var self = this;
            var reg = self.getObjectRegistryEntries (object.constructor.name);

            reg.push (object);

            return self;
        })
        .method ("lookupObject", function (objectType, filter)
        {
            var self = this;
            var reg = self.getObjectRegistryEntries (objectType);

            if (filter)
            {
                return nit.find (reg, nit.cond (filter));
            }
            else
            {
                return reg[0];
            }
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
        .method ("destroy", function ()
        {
            var self = this;
            var cls = self.constructor;
            var onError = cls.suppressedContextError.bind (self);
            var emit = { destroy: self.emit.bind (self, "destroy", self) };

            return nit.invoke.each (nit.values (self.serviceRegistry).concat (emit), function (entry)
            {
                return nit.invoke.safe ([entry, entry.destroy], [entry.service, self], onError);
            });
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

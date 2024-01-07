module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("nit.ServiceProvider"))
        .m ("error.no_provided_types", "The provided types were not set.")
        .defineMeta ("providedTypes...", "string")
        .categorize ("serviceproviders")
        .staticMethod ("createProviderForObject", function (obj, onDestroy)
        {
            var cls = obj.constructor;
            var providerClass = Self.defineSubclass (cls.name + "Provider", true)
                .provides (cls.name)
                .onCreate (function () { return obj; })
                .onDestroy (onDestroy)
            ;

            return new providerClass;
        })
        .staticMethod ("createProviderForClass", function (cls, onDestroy)
        {
            return this.createProviderForObject (nit.new (cls), onDestroy);
        })
        .staticMethod ("provides", function ()
        {
            this.providedTypes = nit.array (arguments);

            return this;
        })
        .method ("provides", function (type)
        {
            var self = this;
            var types = self.constructor.providedTypes;

            if (!types.length)
            {
                self.throw ("error.no_provided_types");
            }

            return !!~types.indexOf (type);
        })
        .lifecycleMethod ("create", null, function (type)
        {
            type = type || this.constructor.providedTypes[0];

            if (this.provides (type))
            {
                return nit.new (type, this.toPojo ());
            }
        })
        .lifecycleMethod ("destroy") // (service)
        .onRegisteredBy (function (hostClass)
        {
            hostClass
                .m ("error.service_provider_not_registered", "The service provider for '%{type}' was not registered.")
                .lifecycleMethod ("lookupServiceProvider", function (serviceType, required)
                {
                    if (!(serviceType = nit.lookupClass (serviceType, !!required)))
                    {
                        return;
                    }

                    var self = this;
                    var cls = self.constructor;
                    var serviceName = serviceType.name;
                    var provider = nit.find (cls.getPlugins.call (self, "serviceproviders"), function (sp) { return sp.provides (serviceName); })
                        || nit.invoke ([self, cls[cls.kLookupServiceProvider]], serviceType)
                    ;

                    if (!provider && required)
                    {
                        self.throw ("error.service_provider_not_registered", { type: serviceName });
                    }

                    return provider;
                })
            ;
        })
    ;
};

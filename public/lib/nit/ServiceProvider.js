module.exports = function (nit)
{
    return nit.definePlugin ("nit.ServiceProvider")
        .defineMeta ("providedTypes...", "string")
        .categorize ("serviceproviders")
        .staticMethod ("provides", function ()
        {
            this.providedTypes = nit.array (arguments);

            return this;
        })
        .method ("provides", function (type)
        {
            return !!~this.constructor.providedTypes.indexOf (type);
        })
        .lifecycleMethod ("create", null, function (type)
        {
            type = type || this.constructor.providedTypes[0];

            if (this.provides (type))
            {
                return nit.new (type, this.toPojo ());
            }
        })
        .lifecycleMethod ("destroy", true) // (service)
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

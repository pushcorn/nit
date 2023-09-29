module.exports = function (nit)
{
    return nit.definePlugin ("ServiceProvider")
        .field ("[options]", "any", "The provider options.")
        .staticMethod ("onUsePlugin", function (hostClass, plugin)
        {
            hostClass
                .defineInnerClass ("ServiceProviderEntry", function (ServiceProviderEntry)
                {
                    ServiceProviderEntry
                        .field ("<id>", "integer", "The service provider ID.")
                        .field ("<scope>", "any", "The scope to which the provider applies.")
                        .field ("<instance>", hostClass.name, "The provider instance.")
                    ;
                })
                .staticProperty ("serviceProviderEntries...", hostClass.ServiceProviderEntry.name)
                .staticLifecycleMethod ("createServiceProviderEntry", function (scope)
                {
                    var cls = this;
                    var entries = cls.serviceProviderEntries;
                    var entry = new hostClass.ServiceProviderEntry (
                    {
                        id: entries.length + 1,
                        scope: scope,
                        instance: new cls (plugin.options)
                    });

                    entries.push (entry);

                    nit.invoke ([cls, cls.kCreateServiceProviderEntry], entry);

                    return entry;
                })
                .staticMethod ("get", function (scope)
                {
                    var cls = this;

                    scope = scope || cls;

                    var entry = cls.serviceProviderEntries.find (function (e) { return e.scope == scope; }) || cls.createServiceProviderEntry (scope);

                    return entry.instance;
                })
            ;
        })
    ;
};

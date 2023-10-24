module.exports = function (nit)
{
    var writer = new nit.Object.Property.Writer;


    return nit.definePlugin ("ServiceProvider")
        .field ("[options]", "any", "The provider options.")
        .staticMethod ("onUsePlugin", function (hostClass, plugin)
        {
            hostClass
                .m ("error.invalid_instance", "The service is not an instance of '%{type}'.")
                .defineInnerClass ("ServiceProviderEntry", function (ServiceProviderEntry)
                {
                    ServiceProviderEntry
                        .staticProperty ("seq", "integer", 1)
                        .field ("<scope>", "any", "The scope to which the provider applies.")
                        .field ("<instance>", hostClass.name, "The provider instance.")

                        .property ("id", "integer", { writer: writer }) // The service provider ID.
                        .onConstruct (function ()
                        {
                            this.id = writer.value (ServiceProviderEntry.seq++);
                        })
                    ;
                })
                .staticProperty ("serviceProviderEntries...", hostClass.ServiceProviderEntry.name)
                .staticLifecycleMethod ("createServiceProviderEntry", function (scope)
                {
                    var cls = this;
                    var entries = cls.serviceProviderEntries;
                    var entry = new hostClass.ServiceProviderEntry (
                    {
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
                .staticMethod ("set", function (scope, instance)
                {
                    var cls = this;

                    if (!(instance instanceof hostClass))
                    {
                        cls.throw ("error.invalid_instance", { type: hostClass.name });
                    }

                    scope = scope || cls;

                    var entries = cls.serviceProviderEntries;

                    nit.arrayRemove (entries, function (e) { return e.scope == scope; });

                    var entry = new hostClass.ServiceProviderEntry (
                    {
                        scope: scope,
                        instance: instance
                    });

                    entries.push (entry);

                    return instance;
                })
            ;
        })
    ;
};

test.method ("nit.ServiceProvider", "provides")
    .should ("return true if the type is supported")
        .up (s => s.Db = nit.defineClass ("test.Db"))
        .up (s => s.class = s.class.defineSubclass ("DbProvider")
            .provides ("test.Db", "test.Srv")
        )
        .given ("test.Db")
        .returns (true)
        .expectingMethodToReturnValue ("object.provides", null, false)
        .expectingMethodToReturnValue ("object.provides", "test2.Db", false)
        .expectingMethodToReturnValue ("object.provides", "test.Srv", true)
        .commit ()
;


test.method ("nit.ServiceProvider", "create")
    .should ("create an instance of the the first provided type if type was not specified")
        .up (s => s.Db = nit.defineClass ("test.Db"))
        .up (s => s.class = s.class.defineSubclass ("DbProvider")
            .provides ("test.Db")
        )
        .returnsInstanceOf ("test.Db")
        .commit ()

    .should ("create an instance of the specifed type")
        .up (s => s.Db = nit.defineClass ("test.Db"))
        .up (s => s.class = s.class.defineSubclass ("DbProvider")
            .provides ("test.Db")
            .onCreate (function ()
            {
                return nit.assign (new s.Db, { created: true });
            })
        )
        .returnsInstanceOf ("test.Db")
        .expectingPropertyToBe ("result.created", true)
        .commit ()

    .should ("throw if the provided types were not set")
        .up (s => s.class = s.class.defineSubclass ("DbProvider"))
        .throws ("error.no_provided_types")
        .commit ()

    .should ("return undefined if the type was not supported")
        .up (() => nit.defineClass ("Srv"))
        .up (s => s.class = s.class.defineSubclass ("DbProvider").provides ("test.Db"))
        .given ("Srv")
        .returns ()
        .commit ()
;


test.method ("nit.ServiceProvider", "destroy")
    .should ("create an instance of the specifed type")
        .up (s => s.Db = nit.defineClass ("test.Db"))
        .up (s => s.class = s.class.defineSubclass ("DbProvider")
            .provides ("test.Db")
            .onDestroy (function (db)
            {
                db.destroyed = true;
            })
        )
        .up (s => s.args = new s.Db)
        .expectingPropertyToBe ("args.0.destroyed", true)
        .commit ()
;


test.method ("nit.ServiceProvider", "createProviderForObject", true)
    .should ("create a local provider for the specified object")
        .up (s => s.MyDb = nit.defineClass ("MyDb"))
        .up (s => s.args = new s.MyDb)
        .returnsInstanceOf ("MyDbProvider")
        .expectingMethodToReturnValue ("result.create", null, s => s.args[0])
        .commit ()
;


test.method ("nit.ServiceProvider", "createProviderForClass", true)
    .should ("create a local provider for the specified class")
        .up (s => s.MyDb = nit.defineClass ("MyDb"))
        .up (s => s.args = s.MyDb)
        .returnsInstanceOf ("MyDbProvider")
        .expectingMethodToReturnValueOfType ("result.create", null, "MyDb")
        .commit ()
;


test.plugin ("nit.ServiceProvider", "lookupServiceProvider", { registerPlugin: true, instancePluginAllowed: true })
    .should ("throw if no provider was registered for the service type")
        .up (s => s.MyDb = nit.defineClass ("MyDb"))
        .up (s => s.DbProvider = nit.defineServiceProvider ("test.serviceproviders.MyDb").provides ("MyDb2"))
        .up (s => s.hostClass.serviceprovider ("test:my-db"))
        .given ("MyDb", true)
        .throws ("error.service_provider_not_registered")
        .commit ()

    .should ("return the provider for the specified service type")
        .up (s => s.MyDb = nit.defineClass ("MyDb"))
        .up (s => s.DbProvider = nit.defineServiceProvider ("test.serviceproviders.MyDb")
            .provides ("MyDb")
        )
        .up (s => s.hostClass.serviceprovider ("test:my-db"))
        .after (s => s.db = s.result.create ("MyDb"))
        .given ("MyDb")
        .returnsInstanceOf ("test.serviceproviders.MyDb")
        .expectingPropertyToBeOfType ("db", "MyDb")
        .commit ()

    .should ("return undefined if the provider does not exist")
        .given ("MyDb2")
        .returns ()
        .commit ()

    .should ("call the hook function if no provider was found")
        .up (s => s.MyDb2 = nit.defineClass ("MyDb2"))
        .up (s => s.hostClass.onLookupServiceProvider (() => new nit.Class))
        .given ("MyDb2")
        .returnsInstanceOf ("nit.Class")
        .commit ()

    .should ("return the instance provider if available")
        .up (s => s.MyDb = nit.defineClass ("MyDb")
            .field ("<dbname>", "string")
        )
        .up (s => s.DbProvider = nit.defineServiceProvider ("test.serviceproviders.MyDb")
            .provides ("MyDb")
            .field ("<dbname>", "string")
        )
        .up (s => s.hostClass.serviceprovider ("test:my-db", "db1"))
        .before (s => s.hostClass.serviceprovider.call (s.host, "test:my-db", "db2"))
        .after (s => s.db = s.result.create ("MyDb"))
        .given ("MyDb")
        .returnsInstanceOf ("test.serviceproviders.MyDb")
        .expectingPropertyToBeOfType ("db", "MyDb")
        .expectingPropertyToBe ("db.dbname", "db2")
        .commit ()
;

test.method ("plugins.ServiceProvider", "onUsePlugin", true)
    .should ("add the get method to the host class")
    .up (s => s.Db = nit.defineClass ("Db")
        .field ("<id>", "string", "The db ID.", () => nit.uuid ())
    )
    .up (s => s.MyDb = nit.defineClass ("MyDb", "Db"))
    .up (s => s.Context = nit.defineClass ("Context")
        .staticMemo ("db", function ()
        {
            return s.Db.get (this);
        })
        .memo ("db", function ()
        {
            return s.MyDb.get (this);
        })
    )
    .up (s => s.Subcontext = nit.defineClass ("Subcontext", "Context"))
    .up (s => s.args = [s.Db, new s.class ({ options: { dbname: "test" } })])
    .after (s =>
    {
        s.Db.onCreateServiceProviderEntry (function (entry)
        {
            s.dbEntry = entry;
            s.createCalled = ~~s.createCalled + 1;
        });

        let a = s.Db.get ();
        let b = s.Db.get ();

        s.sameGetResult = a == b;

        s.ContextDb = s.Context.db;
        s.ctxDb = (new s.Context).db;

        s.SubcontextDb = s.Subcontext.db;
        s.subctxtDb = (new s.Subcontext).db;
    })
    .expectingExprToReturnValue ("contextDb != SubcontextDb", true)
    .expectingExprToReturnValue ("ContextDb != ctxDb", true)
    .expectingExprToReturnValue ("ctxDb != subctxDb", true)
    .expectingPropertyToBe ("sameGetResult", true)
    .expectingPropertyToBe ("Db.serviceProviderEntries.length", 3)
    .expectingPropertyToBe ("createCalled", 5)
    .expectingPropertyToBeOfType ("dbEntry.instance", "MyDb")
    .expectingPropertyToBe ("MyDb.serviceProviderEntries.length", 2)
    .commit ()
;

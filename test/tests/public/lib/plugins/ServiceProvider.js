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
    .after (s =>
    {
        const A = nit.defineClass ("A");
        let db = s.Db.get (A, 99);
        let newDb = new s.Db ();

        expect (db.id).not.toBe (newDb.id);
        expect (db.id).toBe ("99");

        s.Db.set (A, newDb);
        expect (s.Db.serviceProviderEntries.length).toBe (4);
        expect (s.Db.serviceProviderEntries.find (e => e.scope == A).instance).toBe (newDb);

        expect (() => s.Db.set (A, A)).toThrow (/not an instance/);

        s.Db.set (null, newDb);
    })
    .expectingExprToReturnValue ("contextDb != SubcontextDb", true)
    .expectingExprToReturnValue ("ContextDb != ctxDb", true)
    .expectingExprToReturnValue ("ctxDb != subctxDb", true)
    .expectingPropertyToBe ("sameGetResult", true)
    .expectingPropertyToBe ("Db.serviceProviderEntries.length", 4)
    .expectingPropertyToBe ("createCalled", 6)
    .expectingPropertyToBeOfType ("dbEntry.instance", "Db")
    .expectingPropertyToBe ("MyDb.serviceProviderEntries.length", 2)
    .commit ()
;

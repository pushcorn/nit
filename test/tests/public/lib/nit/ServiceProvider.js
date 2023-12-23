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
    .should ("create an instance of the specifed type")
        .up (s => s.Db = nit.defineClass ("test.Db"))
        .up (s => s.class = s.class.defineSubclass ("DbProvider")
            .provides ("test.Db")
            .onCreate (function ()
            {
                return new s.Db;
            })
        )
        .returnsInstanceOf ("test.Db")
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

test.method ("nit.Context", "new", true)
    .should ("create an instance of Context")
        .given ({ a: 3, b: 4 })
        .returnsInstanceOf ("nit.Context")
        .expectingPropertyToBe ("result.a", 3)
        .expectingPropertyToBe ("result.b", 4)
        .commit ()

    .should ("handle the position args")
        .up (s => s.class = s.class.defineSubclass ("test.Context")
            .field ("<req>", "object", "The request")
            .field ("<res>", "object", "The response")
        )
        .given (nit.o ({ req: true }), nit.o ({ res: true }), { a: 3, b: 4 })
        .returnsInstanceOf ("test.Context")
        .expectingPropertyToBe ("result.a", 3)
        .expectingPropertyToBe ("result.b", 4)
        .expectingPropertyToBe ("result.req.req", true)
        .expectingPropertyToBe ("result.res.res", true)
        .commit ()
;


test.object ("nit.Context", true, "serviceRegistry")
    .should ("return the parent's instance if available")
        .up (s => s.parent = new s.class)
        .after (s => s.instance.parent = s.parent)
        .expecting ("the parent registery is the same as the child registery", s => s.instance.serviceRegistry == s.parent.serviceRegistry)
        .expecting ("setting parent's registery is the same as setting child's registery", s =>
        {
            s.parent.serviceRegistry = { t: "p" };

            return s.instance.serviceRegistry == s.parent.serviceRegistry;
        })
        .expecting ("setting child's registery is the same as setting parent's registery", s =>
        {
            s.instance.serviceRegistry = { t: "c" };

            return s.instance.serviceRegistry == s.parent.serviceRegistry;
        })
        .commit ()
;


test.method ("nit.Context", "registerService")
    .should ("register a service for the given scope type")
        .up (s => s.Db = nit.defineClass ("test.Db"))
        .up (s => s.parent = new s.class)
        .before (s => s.object.parent = s.parent)
        .before (s => s.args = new s.Db)
        .returnsInstanceOf ("nit.Context")
        .expecting ("the service is registered", s => s.object.lookupService ("test.Db") == s.args[0])
        .commit ()
;


test.method ("nit.Context", "registerServiceProvider")
    .should ("register a service provider")
        .up (s => s.Db = nit.defineClass ("test.Db"))
        .up (s => s.parent = new s.class)
        .before (s => s.object.parent = s.parent)
        .before (s => s.args = ["test.Db", () => s.created = new s.Db])
        .returnsInstanceOf ("nit.Context")
        .expectingPropertyToBe ("created", undefined)
        .expectingMethodToReturnValueOfType ("object.lookupService", "test.Db", "test.Db")
        .expectingPropertyToBeOfType ("created", "test.Db")
        .commit ()
;


test.method ("nit.Context", "lookupService")
    .should ("return the service for the given scope type")
        .up (s => s.Db = nit.defineClass ("test.Db"))
        .up (s => s.parent = new s.class)
        .up (s => s.parent.registerService (new s.Db))
        .before (s => s.object.parent = s.parent)
        .given ("test.Db")
        .returnsInstanceOf ("test.Db")
        .commit ()

    .should ("return undefined if the service is not registered and optional is true")
        .given ("test.Db", true)
        .returns ()
        .commit ()

    .should ("throw if the service is not registered and optional is false")
        .given ("test.Db")
        .throws ("error.service_not_registered")
        .commit ()

    .should ("throw if the service type is invalid")
        .given ("test.Db2")
        .throws ("error.class_not_defined")
        .commit ()
;


test.custom ("Method: nit.Context.delegateParentProperties ()")
    .should ("delegate the parent's custom properties")
        .task (s =>
        {
            s.grandparent = nit.Context.defineSubclass ("test.GrandParentContext")
                .new ({ x: 1, y: [] })
            ;

            s.parent = nit.Context.defineSubclass ("test.ParentContext")
                .field ("id", "string", "The ID", 100)
                .method ("send", function (data)
                {
                    this.data = data;
                })
                .new ({ parent: s.grandparent, a: 1, b: [], c: [1, 2] })
            ;

            s.child = nit.Context.defineSubclass ("test.ChildContext")
                .new ({ parent: s.parent })
            ;

            s.child.a = 9;
            s.child.b.push (3, 4);
            s.child.c = [9, 10];
            s.child.x = "xx";
            s.child.y = ["yy"];
            s.child.send ("test-data");
        })
        .expectingPropertyToBe ("parent.a", 9)
        .expectingPropertyToBe ("parent.b", [3, 4])
        .expectingPropertyToBe ("parent.c", [9, 10])
        .expectingPropertyToBe ("child.data", "test-data")
        .expectingPropertyToBe ("parent.data", undefined)
        .expectingPropertyToBe ("grandparent.x", "xx")
        .expectingPropertyToBe ("grandparent.y", ["yy"])
        .expecting ("root is the grand parent", s => s.grandparent == s.child.root)
        .commit ()
;

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
        .expecting ("the parent registry is the same as the child registry", s => s.instance.serviceRegistry == s.parent.serviceRegistry)
        .expecting ("setting parent's registry is the same as setting child's registry", s =>
        {
            s.parent.serviceRegistry = { t: "p" };

            return s.instance.serviceRegistry == s.parent.serviceRegistry;
        })
        .expecting ("setting child's registry is the same as setting parent's registry", s =>
        {
            s.instance.serviceRegistry = { t: "c" };

            return s.instance.serviceRegistry == s.parent.serviceRegistry;
        })
        .commit ()
;


test.object ("nit.Context", true, "objectRegistry")
    .should ("return the parent's instance if available")
        .up (s => s.parent = new s.class)
        .after (s => s.instance.parent = s.parent)
        .expecting ("the parent registry is the same as the child registry", s => s.instance.objectRegistry == s.parent.objectRegistry)
        .expecting ("setting parent's registry is the same as setting child's registry", s =>
        {
            s.parent.objectRegistry = { t: "p" };

            return s.instance.objectRegistry == s.parent.objectRegistry;
        })
        .expecting ("setting child's registry is the same as setting parent's registry", s =>
        {
            s.instance.objectRegistry = { t: "c" };

            return s.instance.objectRegistry == s.parent.objectRegistry;
        })
        .commit ()
;



test.method ("nit.Context", "registerService")
    .should ("register a service")
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
    .should ("lookup a service of the specified type")
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


test.method ("nit.Context", "registerObject")
    .should ("register an object")
        .up (s => s.Obj = nit.defineClass ("test.Obj"))
        .up (s => s.parent = new s.class)
        .before (s => s.object.parent = s.parent)
        .before (s => s.args = new s.Obj)
        .returnsResultOfExpr ("object")
        .expecting ("the object is registered", s => s.object.objectRegistry["test.Obj"][0] == s.args[0])
        .commit ()
;


test.method ("nit.Context", "lookupObject")
    .should ("return an object of the specified type")
        .up (s => s.Obj = nit.defineClass ("test.Obj")
            .field ("<id>", "integer")
        )
        .up (s => s.parent = new s.class)
        .before (s => s.object.parent = s.parent)
        .before (s => s.object.registerObject (new s.Obj (3)))
        .before (s => s.object.registerObject (new s.Obj (5)))
        .before (s => s.object.registerObject (new s.Obj (7)))
        .before (s => s.args = "test.Obj")
        .returnsInstanceOf ("test.Obj")
        .expectingPropertyToBe ("result.id", 3)
        .expectingMethodToReturnValue ("object.lookupObject", ["test.Obj", { id: 7 }], s => s.object.objectRegistry["test.Obj"][2])
        .expecting ("the context and its parent's objectRegistry are the same", s => s.object.objectRegistry == s.object.parent.objectRegistry)
        .commit ()
;

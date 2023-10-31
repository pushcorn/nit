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


test.custom ("Method: nit.Context.nit_Context_delegateProperties ()")
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
                .new ({ nit_Context_parent: s.grandparent, a: 1, b: [], c: [1, 2] })
            ;

            s.child = nit.Context.defineSubclass ("test.ChildContext")
                .new ({ nit_Context_parent: s.parent })
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
        .expecting ("root is the grand parent", s => s.grandparent == s.child.nit_Context_root)
        .commit ()
;

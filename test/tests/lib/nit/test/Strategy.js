test ("nit.test.Strategy.Expector", async () =>
{
    const STRATEGY = {};

    const Strategy = nit.test.Strategy;
    const TestValidator = Strategy.IValidator.defineSubclass ("TestValidator")
        .method ("validate", function (strategy, value)
        {
            this.validateCalled = true;
            this.strategy = strategy;
            this.value = value;
        })
    ;

    let validator = new TestValidator;
    let expector = new Strategy.Expector ("expect...", validator, function (strategy)
    {
        this.valueGetterCalled = true;
        this.strategy = strategy;

        return 10;
    });

    await expector.validate (STRATEGY);
    expect (expector.valueGetterCalled).toBe (true);
    expect (expector.strategy).toBe (STRATEGY);
    expect (validator.validateCalled).toBe (true);
    expect (validator.strategy).toBe (STRATEGY);
    expect (validator.value).toBe (10);
});


test ("nit.test.Strategy.App", () =>
{
    let root = nit.path.join (nit.os.tmpdir (), "app-" + nit.uuid ());
    let app = new nit.test.Strategy.App ("", root);

    expect (nit.isDir (root)).toBe (true);

    app = new nit.test.Strategy.App ();
    expect (app.root.path.split (nit.path.sep).pop ()).toMatch (/^[0-f]{32}$/);
    expect (nit.fs.existsSync (app.root.join ("package.json"))).toBe (true);

    app = new nit.test.Strategy.App ("", test.pathForProject ("project-c"));
    expect (nit.fs.existsSync (app.root.path)).toBe (true);
});


test ("nit.test.Strategy.ValueValidator", () =>
{
    let validator = new nit.test.Strategy.ValueValidator ({ expected: 123 });

    expect (() => validator.validate ({ error: "has err" })).toThrow ("has err");

    validator.validate ({ error: "has err" }, 123);
    validator.validate ({ result: 123 });

    validator.expected = /3$/;
    validator.validate ({ result: 123 });

    validator.expected = { v: 123 };
    validator.validate ({ result: { v: 123 } });
});


test ("nit.test.Strategy.TypeValidator", () =>
{
    let validator = new nit.test.Strategy.TypeValidator ({ expected: "string" });

    expect (() => validator.validate ({ error: "has err" })).toThrow ("has err");

    validator.validate ({ error: "has err" }, "teststring");
    validator.validate ({ result: "teststring2" });

    validator.expected = RegExp;
    validator.validate ({ result: /str/ });

    validator.expected = "Date";
    validator.validate ({ result: new Date });

    validator.expected = "undefined";
    validator.validate ({ result: undefined });
});


test ("nit.test.Strategy.ErrorValidator", () =>
{
    let validator = new nit.test.Strategy.ErrorValidator ({ expected: "validation err" });

    expect (() => validator.validate ({})).toThrow (/the test did not throw/i);

    validator.validate ({ error: "has err" }, new Error ("validation err"));
    validator.validate ({ error: new Error ("validation err") });

    validator.expected = /validation err/;
    validator.validate ({ error: new Error ("validation err") });

    let err = new Error ("validation err");
    err.code = "error.test_err";

    validator.expected = "error.test_err";
    validator.validate ({ error: err });
});


test ("nit.test.Strategy.Mock", () =>
{
    const A = nit.defineClass ("A")
        .method ("addOne", function (val)
        {
            return val + 1;
        })
    ;

    let a = new A;
    let mock = new nit.test.Strategy.Mock (a, "addOne", 10);
    mock.apply ({});
    expect (a.addOne ()).toBe (10);
    expect (a.addOne (100)).toBe (10);
    expect (mock.invocations.length).toBe (2);
    mock.restore ();
    expect (a.addOne (100)).toBe (101);

    mock = new nit.test.Strategy.Mock (a, "addOne", function (v) { return v * 2; });
    mock.apply ({});
    expect (a.addOne (2)).toBe (4);
    mock.restore ();

    mock = new nit.test.Strategy.Mock ("a", "addOne", function (v) { return v * 3; });
    mock.apply ({ a });
    expect (a.addOne (3)).toBe (9);
    mock.restore ();
});


test ("nit.test.Strategy.TRANSFORMS.format ()", () =>
{
    expect (nit.test.Strategy.TRANSFORMS.format ("a string")).toBe ('"a string"');
    expect (nit.test.Strategy.TRANSFORMS.format ({ a: 1 })).toBe ('{"a":1}');
});


test ("nit.test.Strategy.TRANSFORMS.formatArgs ()", () =>
{
    expect (nit.test.Strategy.TRANSFORMS.formatArgs ([3, "string", null])).toBe ('3, "string", <null>');
});


test ("nit.test.Strategy.render ()", () =>
{
    expect (nit.test.Strategy.render ("the string is %{s|format}", { s: "test" })).toBe ('the string is "test"');
});


test ("nit.test.Strategy.serialize ()", () =>
{
    expect (nit.test.Strategy.serialize (null)).toBe ("<null>");
    expect (nit.test.Strategy.serialize (undefined)).toBe ("<undefined>");
    expect (nit.test.Strategy.serialize ({ a: 1 })).toBe ('{"a":1}');
});


test ("nit.test.Strategy.test ()", () =>
{
    function tester ()
    {
    }

    const CommandStrategy = nit.test.defineStrategy ("Command")
        .test (tester)
    ;

    expect (CommandStrategy.prototype.test).toBe (tester);
});


test ("nit.test.Strategy.snapshot ()", () =>
{
    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .test (function ()
        {
            return this.object[this.property];
        })
    ;

    const A = nit.defineClass ("A")
        .field ("<name>", "string")
    ;

    let a = new A ("AAA");
    let strategy = new PropertyStrategy (new A ("AAA"), "name");

    expect (strategy.snapshot (true)).toEqual (
    {
        description: '[Untitled Test]',
        message: '',
        befores: [],
        afters: [],
        inputs: [],
        result: undefined,
        error: undefined,
        object: a,
        property: "name",
        app: undefined,
        expectors: [],
        resultValidator: undefined,
        mocks: [],
        thisOnly: false,
        dir: ""
    });

    strategy.snapshot ();

    expect (strategy.lastSnapshot).toEqual (
    {
        description: '[Untitled Test]',
        message: '',
        befores: [],
        afters: [],
        inputs: [],
        result: undefined,
        error: undefined,
        object: a,
        property: "name",
        app: undefined,
        expectors: [],
        resultValidator: undefined,
        mocks: [],
        thisOnly: false,
        dir: ""
    });
});


test ("nit.test.Strategy.reset ()", () =>
{
    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .field ("data", "object")
        .test (function ()
        {
            return this.object[this.property];
        })
    ;

    const A = nit.defineClass ("A")
        .field ("<name>", "string")
    ;

    let a = new A ("AAA");
    let before = function () {};
    let after = function () {};
    let strategy = new PropertyStrategy (new A ("AAA"), "name", { data: { d: 1 } })
        .before (before)
        .after (after)
    ;

    strategy.snapshot ();
    strategy.result = 10;
    strategy.reset ();

    expect (strategy.lastSnapshot).toEqual (
    {
        description: '[Untitled Test]',
        message: '',
        befores: [before],
        afters: [after],
        inputs: [],
        result: undefined,
        error: undefined,
        object: a,
        property: "name",
        data: { d: 1 },
        app: undefined,
        expectors: [],
        resultValidator: undefined,
        mocks: [],
        thisOnly: false,
        dir: ""
    });
});


test ("nit.test.Strategy.useApp ()", () =>
{
    let strategy = new nit.test.Strategy;

    strategy.useApp ("my app");

    expect (strategy.app.name).toBe ("my app");
});


test ("nit.test.Strategy.only ()", () =>
{
    let strategy = new nit.test.Strategy;

    strategy.only ();

    expect (strategy.thisOnly).toBe (true);
});


test ("nit.test.Strategy.should,can ()", () =>
{
    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .test (function ()
        {
            return this.object[this.property];
        })
    ;

    const A = nit.defineClass ("A")
        .field ("<name>", "string")
    ;

    let strategy = new PropertyStrategy (new A ("AAA"), "name")
        .should ("return the value of a property")
    ;

    expect (strategy.message).toBe ("should return the value of a property");

    strategy.should ();
    expect (strategy.message).toBe ("should return the value of a property");

    strategy.can ("return the value of a property");
    expect (strategy.message).toBe ("can return the value of a property");

    strategy.can ();
    expect (strategy.message).toBe ("can return the value of a property");
});


test ("nit.test.Strategy.mock... ()", () =>
{
    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .test (function ()
        {
            return this.object[this.property];
        })
    ;

    const A = nit.defineClass ("A")
        .field ("<name>", "string")
    ;

    let a = new A ("AAA");
    let strategy = new PropertyStrategy (new A ("AAA"), "name")
        .mock (a, "addOne", 3)
    ;

    expect (strategy.mocks.length).toBe (1);

    strategy.before (nit.noop);
    strategy.after (nit.noop);
    strategy.given (1, 2, 3);
    expect (strategy.befores.length).toBe (1);
    expect (strategy.afters.length).toBe (1);
    expect (strategy.inputs[0]).toEqual ([1, 2, 3]);

    strategy.returnsInstanceOf ("string");
    expect (strategy.resultValidator).toBeInstanceOf (PropertyStrategy.TypeValidator);

    strategy.returns ("name");
    expect (strategy.resultValidator).toBeInstanceOf (PropertyStrategy.ValueValidator);

    strategy.throws (/test errr/);
    expect (strategy.resultValidator).toBeInstanceOf (PropertyStrategy.ErrorValidator);
});


test ("nit.test.Strategy.expecting... ()", async () =>
{
    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .test (function ()
        {
            return this.object[this.property];
        })
    ;

    const A = nit.defineClass ("A")
        .field ("<name>", "string")
        .method ("nameLength", function ()
        {
            return this.name.length;
        })
        .method ("causeProblem", function ()
        {
            throw new Error ("problem!");
        })
    ;

    let strategy = new PropertyStrategy (new A ("AAA"), "name");

    strategy.expectingPropertyToBe ("object.name", "AAA");
    expect (strategy.expectors.length).toBe (1);
    expect (strategy.expectors[0].valueGetter (strategy)).toBe ("AAA");

    strategy.expectingPropertyToBeOfType ("object.name", "string");
    expect (strategy.expectors.length).toBe (2);
    expect (strategy.expectors[1].valueGetter (strategy)).toBe ("AAA");

    strategy.expectingMethodToReturnValue ("object.nameLength", 3);
    expect (strategy.expectors.length).toBe (3);
    expect (strategy.expectors[2].valueGetter (strategy)).toBe (3);

    strategy.expectingMethodToReturnValueOfType ("object.nameLength", "integer");
    expect (strategy.expectors.length).toBe (4);
    expect (strategy.expectors[3].valueGetter (strategy)).toBe (3);

    strategy.expectingMethodToThrow ("object.causeProblem", /problem/);
    expect (strategy.expectors.length).toBe (5);
    expect (() => strategy.expectors[4].valueGetter (strategy)).toThrow (/problem/);

    strategy.expecting ("causeProblem will throw", Error, function (s)
    {
        try { s.object.causeProblem (); } catch (e) { return e.constructor; }
    });
    expect (await strategy.expectors[5].validate (strategy)).toBeUndefined ();
});


test ("nit.test.Strategy.commit ()", async () =>
{
    const _nit = global.nit;
    const Mock = _nit.test.Strategy.Mock;

    let queue = _nit.Queue ();

    const Expect = _nit.defineClass ("Expect", "nit.test.Mock")
      .method ("toBe", function () {})
    ;

    let expectImpl = new Expect;

    let describeMock = Mock (
    {
        object: global,
        method: "describe",
        retval: function (description, cb)
        {
            cb ();
        }
    }).apply ();

    let describeOnlyMock = Mock (
    {
        object: global.describe,
        method: "only",
        retval: function (description, cb)
        {
            cb ();
        }
    }).apply ();

    let expectMock = Mock (
    {
        object: global,
        method: "expect",
        retval: function ()
        {
            return expectImpl;
        }
    }).apply ();

    let itMock = Mock (
    {
        object: global,
        method: "it",
        retval: function (message, cb)
        {
            queue.push (async function ()
            {
                try
                {
                    return await cb ();
                }
                catch (e)
                {
                    itMock.errors = itMock.errors || [];
                    itMock.errors.push (e);
                }
            });
        }
    }).apply ();

    const nit = await test.reloadNit ();

    nit.require ("nit.test.Strategy");

    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .test (function ()
        {
            return this.object[this.property];
        })
    ;

    const A = nit.defineClass ("A")
        .field ("<name>", "string")
        .method ("nameLength", function ()
        {
            return this.name.length;
        })
    ;

    let after = jest.fn ();
    let status = {};

    new PropertyStrategy (new A ("AAA"), "name", { description: "Test property." })
        .should ("pass")
        .given (1, 2, 3)
        .mock (nit, "noop")
        .before (nit.noop)
        .before (async function ()
        {
            await nit.sleep (10);
        })
        .after (nit.noop)
        .returns ("AAA")
        .commit ()

        .should ("pass 2")
        .before (async function ()
        {
            await nit.sleep (10);
            this.throw ("error.failed2");
        })
        .after (after)
        .returns ("AAA")
        .commit ()

        .should ("pass 3")
        .before (async function ()
        {
            await nit.sleep (10);
            this.throw ("error.failed3");
        })
        .commit ()

        .should ("pass 4")
        .useApp ("", test.pathForProject ("project-c"))
        .before (function ()
        {
            status.dirChangedForApp = process.cwd () == this.app.root.path;
        })
        .expectingPropertyToBe ("object.name", "AAA")
        .commit ()

        .should ("pass 5")
        .chdir (test.pathForProject ("project-a"))
        .only ()
        .before (function ()
        {
            status.dirChanged = process.cwd () == this.dir;
        })
        .expectingPropertyToBe ("object.name", "AAA")
        .commit ()
    ;

    await queue.run ();

    describeMock.restore ();
    describeOnlyMock.restore ();
    itMock.restore ();
    expectMock.restore ();

    expect (itMock.errors[0].code).toBe ("error.failed2");
    expect (itMock.errors[1].code).toBe ("error.failed3");
    expect (describeMock.invocations.length).toBe (4);
    expect (describeOnlyMock.invocations.length).toBe (1);
    expect (itMock.invocations.length).toBe (7);
    expect (expectMock.invocations.length).toBe (3);
    expect (status.dirChangedForApp).toBe (true);
    expect (status.dirChanged).toBe (true);
});

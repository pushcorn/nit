test ("nit.test.Strategy.addSetupFilesForPackage ()", async () =>
{
    const Strategy = nit.test.Strategy;
    const Project = Strategy.Project;

    let proj = new Project ("project-a", true);

    proj.begin ();
    Strategy.addSetupFilesForPackage ("package-a");

    expect (global.PROJECT_A_PACKAGE_A_SETUP_LOADED).toBe (true);
    expect (global.PROJECT_A_PACKAGE_A_SETUP_LOCAL_LOADED).toBe (true);
    expect (Strategy.additionalAssetPaths).toEqual ([nit.path.join (proj.root.path, "packages/package-a/test")]);

    Strategy.additionalAssetPaths = [];
    proj.end ();
});


test ("nit.test.Strategy.Expector", async () =>
{
    const STRATEGY = {};

    const Strategy = nit.test.Strategy;
    const NoCbValidator = Strategy.Validator.defineSubclass ("NoCbValidator");

    let noCbValidator = new NoCbValidator (Strategy.getSourceLine ());

    expect (() => noCbValidator.validate ()).toThrow (/hook.*validate.* was not implemented/);

    const TestValidator = Strategy.Validator.defineSubclass ("TestValidator")
        .onValidate (function (strategy, value)
        {
            this.validateCalled = true;
            this.strategy = strategy;
            this.value = value;
        })
    ;

    let validator = new TestValidator (Strategy.getSourceLine ());
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


test ("nit.test.Strategy.Application", () =>
{
    let root = nit.path.join (nit.os.tmpdir (), "app-" + nit.uuid ());
    let app = new nit.test.Strategy.Application ("", root);

    expect (nit.isDir (root)).toBe (true);

    app = new nit.test.Strategy.Application ();
    expect (app.root.path.split (nit.path.sep).pop ()).toMatch (/^[0-9a-f]{32}$/i);
    expect (nit.fs.existsSync (app.root.join ("package.json"))).toBe (true);

    app = new nit.test.Strategy.Application ("", test.pathForProject ("project-c"));
    expect (nit.fs.existsSync (app.root.path)).toBe (true);
});


test ("nit.test.Strategy.Project", () =>
{
    const Project = nit.test.Strategy.Project;

    let projectPathA = test.pathForProject ("project-a");
    let projectPathB = test.pathForProject ("project-b");
    let proj = new Project ("project-a", true);
    let projB = new Project (projectPathB);

    expect (nit.isDir (proj.root.path)).toBe (true);
    expect (nit.isDir (projB.root.path)).toBe (true);

    let oldProjectPaths = nit.PROJECT_PATHS;
    let oldAssetPaths = nit.ASSET_PATHS;

    proj.begin ();

    let newProjectPaths = nit.PROJECT_PATHS;
    let newAssetPaths = nit.ASSET_PATHS;

    proj.end ();

    let afterProjectPaths = nit.PROJECT_PATHS;
    let afterAssetPaths = nit.ASSET_PATHS;

    expect (newProjectPaths.filter (p => !oldProjectPaths.includes (p)))
        .toEqual ([projectPathA]);

    expect (newAssetPaths.some (p => p.includes ("/packages/http"))).toBe (false);
    expect (afterAssetPaths.some (p => p.includes ("/packages/http"))).toBe (true);

    expect (newAssetPaths.filter (p => !oldAssetPaths.includes (p)))
        .toEqual (
        [
            projectPathA,
            nit.path.join (projectPathA, "packages/package-a"),
            nit.path.join (projectPathA, "packages/package-b")
        ]);

    expect (oldProjectPaths).toEqual (afterProjectPaths);
    expect (oldAssetPaths).toEqual (afterAssetPaths);

    // package dir
    nit.dpg (nit, "CWD", nit.path.join (nit.HOME, "packages/http"), true);

    let paths =
    [
        nit.HOME,
        nit.path.join (nit.HOME, "packages/http"),
        nit.path.join (nit.HOME, "packages/cron"),
        nit.path.join (nit.HOME, "packages/ui")
    ];

    Project.removeRootPackages (paths);

    expect (paths).toEqual (
    [
        nit.HOME,
        nit.path.join (nit.HOME, "packages/http")
    ]);

    nit.dpg (nit, "CWD", nit.HOME, true);

    // root project from package dir
    proj = new Project ("project-a", true, true);
    expect (proj.root.path).toBe (nit.path.join (nit.HOME, "test/resources/project-a"));
});


test ("nit.test.Strategy.ValueValidator", () =>
{
    let validator = new nit.test.Strategy.ValueValidator (nit.test.Strategy.getSourceLine (), { expected: 123 });

    expect (() => validator.validate ({ error: new Error ("has err") })).toThrow ("has err");

    validator.validate ({ error: "has err" }, 123);
    validator.validate ({ result: 123 });

    validator.expected = /3$/;
    validator.validate ({ result: 123 });

    validator.expected = { v: 123 };
    validator.validate ({ result: { v: 123 } });

    validator.expected = function () { return 9; };
    validator.validate ({ result: 9 });

    const A = nit.defineClass ("A")
        .field ("<val>", "string")
    ;

    validator.expected = new A (99);
    validator.validate ({ result: new A (99) });
});


test ("nit.test.Strategy.SubsetValidator", () =>
{
    let validator = new nit.test.Strategy.SubsetValidator (nit.test.Strategy.getSourceLine (), { expected: { a: 1 }});

    expect (() => validator.validate ({ error: new Error ("has err") })).toThrow ("has err");

    validator.validate ({ result: { a: 1, b: 2 } });

    validator.expected = [1, 2];
    validator.validate ({ result: [3, 1, 4, 2] });

    validator.expected = { a: { b: [1, 2] } };
    validator.validate ({ result: { a: { b: [3, 1, 4, 2] } } });

    const MyClass = nit.defineClass ("MyClass");

    validator.expected = { name: "MyClass" };
    validator.validate ({ result: MyClass });

    validator.expected = { class: { name: "MyClass" } };
    validator.validate ({ result: { class: MyClass } });
    validator.validate ({}, { class: MyClass });

    validator.expected =
    {
        arr:
        [
        {
            a: "a",
            c: ["ddd"]
        }
        ]
    };

    validator.validate (
    {
        result:
        {
            arr:
            [
            {
                a: "a",
                b: 1,
                c: ["ddd", "eee"]
            }
            ]
        }
    });
});


test ("nit.test.Strategy.TypeValidator", () =>
{
    let validator = new nit.test.Strategy.TypeValidator (nit.test.Strategy.getSourceLine (), { expected: "string" });

    expect (() => validator.validate ({ error: new Error ("has err") })).toThrow ("has err");

    validator.validate ({ error: new Error ("has err") }, "teststring");
    validator.validate ({ result: "teststring2" });

    validator.expected = RegExp;
    validator.validate ({ result: /str/ });

    validator.expected = "Date";
    validator.validate ({ result: new Date });

    validator.expected = "undefined";
    validator.validate ({ result: undefined });

    const A = nit.defineClass ("A");
    const B = nit.defineClass ("B", "A");

    validator = new nit.test.Strategy.TypeValidator (nit.test.Strategy.getSourceLine (), { expected: A, subclass: true });
    validator.validate ({ result: B });

    validator = new nit.test.Strategy.TypeValidator (nit.test.Strategy.getSourceLine (), { expected: "A", subclass: true });
    validator.validate ({ result: B });
});


test ("nit.test.Strategy.ErrorValidator", () =>
{
    let validator = new nit.test.Strategy.ErrorValidator (nit.test.Strategy.getSourceLine (), { expected: "validation err" });

    expect (() => validator.validate ({})).toThrow (/the test did not throw/i);

    validator.validate ({ error: new Error ("has err") }, new Error ("validation err"));
    validator.validate ({ error: new Error ("validation err") });

    validator.expected = /validation err/;
    validator.validate ({ error: new Error ("validation err") });

    let err = new Error ("validation err");
    err.code = "error.test_err";

    validator.expected = "error.test_err";
    validator.validate ({ error: err });

    validator.expected = "another err";
    validator.validate ({ error: "another err" });

    validator.expected = function (e) { return e == 123; };
    validator.validate ({ error: 123 });
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

    mock = new nit.test.Strategy.Mock ("a", "addOne", function () { throw new Error ("NO!!"); });
    mock.apply ({ a });
    expect (() => a.addOne (3)).toThrow ("NO!!");
    expect (mock.invocations[0].error).toBeInstanceOf (Error);

    mock = new nit.test.Strategy.Mock ("aaa", "addOne");
    mock.apply ({ a });
    expect (mock.applied).toBe (false);

    a = new A;
    mock = new nit.test.Strategy.Mock (a, "addOne", 9, { iterations: 2 });
    mock.apply ({ a });
    expect (a.addOne (2)).toBe (9);
    expect (a.addOne (2)).toBe (9);
    expect (a.addOne (2)).toBe (3);
});


test ("nit.test.Strategy.Spy", () =>
{
    const A = nit.defineClass ("A")
        .method ("addOne", function (val)
        {
            return (val || 0) + 1;
        })
        .method ("addTwo", function ()
        {
            throw new Error ("ERR!");
        })
    ;

    let a = new A;
    let cbCalled = 0;
    let spy = new nit.test.Strategy.Spy (a, "addOne", function ()
    {
        cbCalled++;
    });

    let st = {};
    spy.apply (st);
    expect (spy.applied).toBe (true);
    spy.apply (st);
    expect (a.addOne ()).toBe (1);
    expect (a.addOne (100)).toBe (101);
    expect (spy.invocations.length).toBe (2);
    expect (cbCalled).toBe (2);
    spy.restore ();
    expect (a.addOne (99)).toBe (100);

    spy = new nit.test.Strategy.Spy ("a", "addTwo");
    spy.apply ({ a });
    expect (() => a.addTwo ()).toThrow ("ERR!");
    expect (spy.invocations[0].error).toBeInstanceOf (Error);

    spy = new nit.test.Strategy.Spy ("aaa", "addOne");
    spy.apply ({ a });
    expect (spy.applied).toBe (false);

    a = new A;
    spy = new nit.test.Strategy.Spy (a, "addOne", { iterations: 2 });
    spy.apply ({ a });
    expect (a.addOne (2)).toBe (3);
    expect (a.addOne (3)).toBe (4);
    expect (spy.applied).toBe (false);
    expect (a.addOne (4)).toBe (5);
});


test ("nit.test.Strategy.TRANSFORMS.format ()", () =>
{
    expect (nit.test.Strategy.TRANSFORMS.format ("a string")).toBe ('"a string"');
    expect (nit.test.Strategy.TRANSFORMS.format ({ a: 1 })).toBe ('{"a":1}');
    expect (nit.test.Strategy.TRANSFORMS.format (/ab/)).toBe ("/ab/");
    expect (nit.test.Strategy.TRANSFORMS.format (function add (a, b)
    {
        return a + b;
    })).toBe ("function add(a, b) { return a + b; }");
});


test ("nit.test.Strategy.TRANSFORMS.formatType ()", () =>
{
    expect (nit.test.Strategy.TRANSFORMS.formatType ("string")).toBe ("string");
    expect (nit.test.Strategy.TRANSFORMS.formatType (function A () {})).toBe ("A");
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
        .onTest (tester)
    ;

    expect (CommandStrategy["nit.test.Strategy.test"]).toBe (tester);
});


test ("nit.test.Strategy.snapshot ()", () =>
{
    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .onTest (function ()
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
        proj: undefined,
        args: [],
        downs: [],
        ups: [],
        expectors: [],
        inits: [],
        deinits: [],
        spies: [],
        preCommits: [],
        postCommits: [],
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
        proj: undefined,
        args: [],
        downs: [],
        ups: [],
        expectors: [],
        inits: [],
        deinits: [],
        preCommits: [],
        postCommits: [],
        spies: [],
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
        .onTest (function ()
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
        befores: [strategy.befores[0]],
        afters: [strategy.afters[0]],
        inputs: [],
        result: undefined,
        error: undefined,
        object: a,
        property: "name",
        data: { d: 1 },
        app: undefined,
        proj: undefined,
        args: [],
        downs: [],
        ups: [],
        expectors: [],
        inits: [],
        deinits: [],
        preCommits: [],
        postCommits: [],
        spies: [],
        resultValidator: undefined,
        mocks: [],
        thisOnly: false,
        dir: ""
    });
});


test ("nit.test.Strategy.reset ()", async () =>
{
    const nit = await test.reloadNit ();
    let hook;

    test.mock (global, "afterAll", _hook => hook = _hook, 2);

    nit.require ("nit.test.Strategy");

    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .field ("data", "object")
        .onTest (function ()
        {
            return this.object[this.property];
        })
    ;

    const A = nit.defineClass ("A")
        .field ("<name>", "string")
    ;

    let strategy = new PropertyStrategy (new A ("AAA"), "name", { data: { d: 1 } });

    strategy.reset ("not committed");
    expect (() => hook ()).toThrow (/not committed/);

    strategy.should ("will commit");
    strategy.committed[strategy.testId] = true;
    expect (hook ()).toBeUndefined ();
});


test ("nit.test.Strategy.application ()", () =>
{
    let strategy = new nit.test.Strategy;

    strategy.application ("my app");

    expect (strategy.app.name).toBe ("my app");
});


test ("nit.test.Strategy.project ()", () =>
{
    let strategy = new nit.test.Strategy;

    strategy.project ("project-a");

    expect (strategy.proj.root.path).toBe (test.pathForProject ("project-a"));
});


test ("nit.test.Strategy.only ()", () =>
{
    let strategy = new nit.test.Strategy;

    strategy.only ();

    expect (strategy.thisOnly).toBe (true);
});


test ("nit.test.Strategy.should,can ()", async () =>
{
    const nit = await test.reloadNit ();

    test.mock (global, "afterAll", null, 2);
    nit.require ("nit.test.Strategy");

    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .onTest (function ()
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


test ("nit.test.Strategy.mock ()", () =>
{
    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .onTest (function ()
        {
            return this.object[this.property];
        })
    ;

    const A = nit.defineClass ("A")
        .field ("<name>", "string")
    ;

    let a = new A ("AAA");
    let strategy = new PropertyStrategy (a, "name")
        .mock (a, "addOne", 3)
    ;

    expect (strategy.mocks.length).toBe (1);

    strategy.before (nit.noop);
    strategy.after (nit.noop);
    strategy.given (1, 2, 3);
    strategy.assign ({ kk: "vv" });

    expect (strategy.befores.length).toBe (1);
    expect (strategy.afters.length).toBe (1);
    expect (strategy.inputs[0]).toEqual ([1, 2, 3]);
    expect (strategy.kk).toBe ("vv");

    strategy.returnsInstanceOf ("string");
    expect (strategy.resultValidator).toBeInstanceOf (PropertyStrategy.TypeValidator);

    strategy.returns ("name");
    expect (strategy.resultValidator).toBeInstanceOf (PropertyStrategy.ValueValidator);

    strategy.returnsResultContaining ({ a: 1 });
    expect (strategy.resultValidator).toBeInstanceOf (PropertyStrategy.SubsetValidator);

    strategy.returnsResultOfExpr ("object");
    expect (strategy.resultValidator).toBeInstanceOf (PropertyStrategy.ValueValidator);

    strategy.throws (/test errr/);
    expect (strategy.resultValidator).toBeInstanceOf (PropertyStrategy.ErrorValidator);

    strategy.testing = true;
    expect (strategy.mock (a, "addTwo")).toBeInstanceOf (PropertyStrategy.Mock);
});


test ("nit.test.Strategy.spy ()", () =>
{
    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .onTest (function ()
        {
            return this.object[this.property];
        })
    ;

    const A = nit.defineClass ("A")
        .field ("<name>", "string")
        .method ("upper", function ()
        {
            return this.name.toUpperCase ();
        })
    ;

    let a = new A ("AAA");
    let strategy = new PropertyStrategy (new A ("AAA"), "name")
        .spy (a, "upper")
    ;

    expect (strategy.spies.length).toBe (1);

    strategy.testing = true;
    expect (strategy.spy (a, "lower")).toBeInstanceOf (PropertyStrategy.Spy);
});


test ("nit.test.Strategy.expecting... ()", async () =>
{
    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .onTest (function ()
        {
            return this.object[this.property];
        })
    ;

    const A = nit.defineClass ("A")
        .field ("<name>", "string")
        .field ("obj", "any")
        .method ("nameLength", function ()
        {
            return this.name.length;
        })
        .method ("causeProblem", function ()
        {
            throw new Error ("problem!");
        })
        .method ("returnObject", function ()
        {
            return { a: 1, b: 2 };
        })
    ;

    let strategy = new PropertyStrategy (new A ("AAA", { obj: { a: 1, b: 2 } }), "name");

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
    expect (await strategy.expectors[4].valueGetter (strategy)).toBeInstanceOf (Error);

    strategy.expecting ("causeProblem will throw", Error, function (s)
    {
        try { s.object.causeProblem (); } catch (e) { return e.constructor; }
    });
    expect (await strategy.expectors[5].validate (strategy)).toBeUndefined ();

    strategy.expectingPropertyToBe ("object", { name: "AAA" }, true);
    expect (strategy.expectors.length).toBe (7);
    expect (strategy.expectors[6].valueGetter (strategy)).toEqual ({ name: "AAA", obj: { a: 1, b: 2 }});

    strategy.expectingPropertyToContain ("object.obj", { b: 2 });
    expect (strategy.expectors[7].valueGetter (strategy)).toEqual ({ a: 1, b: 2 });

    strategy.expectingMethodToReturnValue ("object.returnObject", null, { b: 2 }, true);
    expect (strategy.expectors[8].valueGetter (strategy)).toEqual ({ a: 1, b: 2 });

    strategy.expectingMethodToReturnValueContaining ("object.returnObject", null, { b: 2 });
    expect (strategy.expectors[9].valueGetter (strategy)).toEqual ({ a: 1, b: 2 });

    strategy.expectingExprToReturnValue ("object.nameLength () + 3", 6);
    expect (strategy.expectors[10].valueGetter (strategy)).toBe (6);

    strategy.expectingExprToReturnValueOfType ("object.nameLength () + 4", "integer");
    expect (strategy.expectors[11].valueGetter (strategy)).toBe (7);

    strategy.expectingExprToReturnValueContaining ("nit.assign (object.obj, { e: 9 })", { b: 2, e: 9 });
    expect (strategy.expectors[12].valueGetter (strategy)).toEqual ({ a: 1, b: 2, e: 9 });

    strategy.expectingExprToThrow ("object.causeProblem ()", /problem/);
    expect (await strategy.expectors[13].valueGetter (strategy)).toBeInstanceOf (Error);

    strategy.expectingExprToReturnValue ("object.returnObject ()", { b: 2 }, true);
    expect (strategy.expectors[14].valueGetter (strategy)).toEqual ({ a: 1, b: 2 });

    strategy.expecting ("accept the value getter as the second arg", function (s)
    {
        return s.object.name == "AAA";
    });
    expect (strategy.expectors[15].valueGetter (strategy)).toEqual (true);
});


test ("nit.test.Strategy.testUp,testDown ()", () =>
{
    let st = new nit.test.Strategy ();

    expect (st.testUp ()).toBe (st);
    expect (st.testDown ()).toBe (st);
});


test ("nit.test.Strategy.commit ()", async () =>
{
    const _nit = global.nit;
    const Mock = _nit.test.Strategy.Mock;

    let queue = _nit.Queue ();
    let lastValues = [];

    const Expect = _nit.defineClass ("Expect", "nit.test.Mock")
        .field ("result", "any")
        .property ("expected", "any")
        .property ("isEqual", "boolean")
        .method ("toBe", function (expected)
        {
            return this.isEqual = (this.expected = expected) == this.result;
        })
    ;

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
        retval: function (result)
        {
            return new Expect ({ result });
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

    test.mock (global, "afterAll", null, 5);
    nit.require ("nit.test.Strategy");

    const PropertyStrategy = nit.test.defineStrategy ("Property")
        .field ("<object>", "object")
        .field ("<property>", "string")
        .onTestUp (function ()
        {
            PropertyStrategy.upCalled = ~~PropertyStrategy.upCalled + 1;
        })
        .onTestDown (function ()
        {
            PropertyStrategy.downCalled = ~~PropertyStrategy.downCalled + 1;
        })
        .onTest (function ()
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

    let propertyStrategy = new PropertyStrategy (new A ("AAA"), "name", { description: "Test property." })
        .should ("pass") // expect 0
            .init (s => lastValues.push (s.last))
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
            .init (s => lastValues.push (s.last))
            .before (async function ()
            {
                await nit.sleep (10);
                this.throw ("error.failed2");
            })
            .after (after)
            .returns ("AAA")
            .commit ()

        .should ("pass 3")
            .init (s => lastValues.push (s.last))
            .project ("project-a")
            .before (async function ()
            {
                status.dirChangedForProject = process.cwd () == this.proj.root.path;

                await nit.sleep (10);
                this.throw ("error.failed3");
            })
            .commit ()

        .should ("pass 4")  // expect 1
            .init (s => lastValues.push (s.last))
            .application ("", test.pathForProject ("project-c"))
            .before (function ()
            {
                status.dirChangedForApp = process.cwd () == this.app.root.path;
            })
            .expectingPropertyToBe ("object.name", "AAA")
            .expectingPropertyToBeOfType ("object.name", "string")
            .commit ()

        .should ("pass 5")  // expect 2
            .init (s => lastValues.push (s.last))
            .chdir (test.pathForProject ("project-a"))
            .only ()
            .spy (A.prototype, "nameLength")
            .preCommit (() => status.preCommitCalled = true)
            .postCommit (() => status.postCommitCalled = true)
            .init (function ()
            {
                status.initCalled = true;
            })
            .deinit (function ()
            {
                status.deinitCalled = true;
            })
            .up (function ()
            {
                status.upCalled = true;
            })
            .down (function ()
            {
                status.downCalled = true;
            })
            .before (function ()
            {
                status.dirChanged = process.cwd () == this.dir;
                this.object.nameLength ();
            })
            .after (function ()
            {
                status.spyCalled = this.spies[0].invocations.length;
            })
            .expectingPropertyToBe ("object.name", "AAA")
            .commit ()

        .should ("pass 6") // expect 3
            .init (s => lastValues.push (s.last))
            .returnsResultOfExpr ("object.property")
            .commit ()

        .should ("pass 7") // expect 4
            .init (s => lastValues.push (s.last))
            .returnsResultOfExpr ("object.name")
            .commit ()
    ;

    const ErrorStrategy = nit.test.defineStrategy ("Error")
        .onTest (function ()
        {
            throw new Error ("test error!");
        })
        .method ("errorMethod", function ()
        {
            throw new Error ("error method!");
        })
    ;

    new ErrorStrategy ()
        .should ("throw an error")
            .throws ("test error!")
            .expectingMethodToReturnValue ("errorMethod", null, "")
            .commit ()

        .should ("throw again")
            .commit ()
    ;

    await queue.run ();

    describeMock.restore ();
    describeOnlyMock.restore ();
    itMock.restore ();
    expectMock.restore ();

    expect (lastValues).toEqual ([false, false, false, false, false, false, true]);
    expect (itMock.errors[0].code).toBe ("error.failed2");
    expect (itMock.errors[1].code).toBe ("error.failed3");
    expect (itMock.errors[2].message).toBe ("error method!");
    expect (itMock.errors[3].message).toBe ("test error!");
    expect (describeMock.invocations.length).toBe (8);
    expect (describeOnlyMock.invocations.length).toBe (1);
    expect (itMock.invocations.length).toBe (13);
    expect (expectMock.invocations.length).toBe (7);
    expect (expectMock.invocations[3].result.expected).toBe ("AAA");
    expect (expectMock.invocations[4].result.expected).toBeUndefined ();
    expect (expectMock.invocations[5].result.isEqual).toBe (true);
    expect (expectMock.invocations[6].args[0]).toBe ("test error!");
    expect (status.dirChangedForProject).toBe (true);
    expect (status.dirChangedForApp).toBe (true);
    expect (status.dirChanged).toBe (true);
    expect (status.initCalled).toBe (true);
    expect (status.deinitCalled).toBe (true);
    expect (status.preCommitCalled).toBe (true);
    expect (status.postCommitCalled).toBe (true);
    expect (status.upCalled).toBe (true);
    expect (status.downCalled).toBe (true);
    expect (status.spyCalled).toBe (1);
    expect (PropertyStrategy.upCalled).toBe (7);
    expect (PropertyStrategy.downCalled).toBe (5);
    expect (propertyStrategy.preCommits.length).toBe (0);
    expect (propertyStrategy.postCommits.length).toBe (0);
});


test ("nit.test.Strategy.addSourceLineToStack ()", () =>
{
    const Strategy = nit.test.Strategy;

    let err = new Error ("test");
    let sourceLine = "    at test.method (" + __filename + ".test:100:100)";

    Strategy.addSourceLineToStack (err, sourceLine);
    expect (err.stack.split ("\n")[1]).toBe (sourceLine);

    sourceLine = "    at test.method (" + __filename + ":100:100)";
    Strategy.addSourceLineToStack (err, sourceLine);
    expect (err.stack.split ("\n")[1]).not.toBe (sourceLine);
    expect (err.stack.split ("\n")[1]).toMatch (__filename);

    err = Strategy.addSourceLineToStack ("ERRR", sourceLine);
    expect (err.message).toBe ("ERRR");
});


test ("nit.test.Strategy.getSourceLine ()", () =>
{
    const Strategy = nit.test.Strategy;

    expect (Strategy.getSourceLine ()).toMatch (__filename);
});




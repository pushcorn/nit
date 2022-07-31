const no_path = require ("path");


test ("nit getters", () =>
{
    expect (nit.READY).toBe (true);
    expect (nit.HOME).toBe (no_path.dirname (no_path.dirname (no_path.dirname (__dirname))));
    expect (nit.READY).toBe (true);
    expect (nit.DEBUG).toBe (false);
});


test ("nit.PROJECT_PATHS", () =>
{
    jest.resetModules ();

    let testResourcesPath = no_path.join (test.HOME, "test/resources");
    process.env.NIT_PROJECT_PATHS = testResourcesPath;

    let nit = require (test.HOME);
    expect (nit.PROJECT_PATHS).toEqual ([test.HOME, testResourcesPath]);
    delete process.env.NIT_PROJECT_PATHS;
});


test ("nit.PACKAGE_PATHS", () =>
{
    jest.resetModules ();

    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    let nit = require (test.HOME);
    expect (nit.PACKAGE_PATHS).toEqual ([
        test.HOME,
        testProjectPath,
        no_path.join (testProjectPath, "packages/package-a")
    ]);

    delete process.env.NIT_PROJECT_PATHS;
});


test ("nit.throw ()", () =>
{
    try
    {
        nit.throw ("test");
    }
    catch (e)
    {
        expect (e.stack.includes (nit.NIT_ROOT)).toBe (false);
    }
});


test ("nit.dbg ()", () =>
{
    jest.resetModules ();

    let nit = require (test.HOME);
    let args;

    nit.log = function ()
    {
        args = nit.array (arguments);
    };

    nit.dbg ("debug message");
    expect (args).toBeUndefined ();

    process.env.NIT_DEBUG = "true";
    jest.resetModules ();
    nit = require (test.HOME);

    nit.log = function ()
    {
        args = nit.array (arguments);
    };
    nit.dbg ("debug message");
    expect (args).toEqual (["[DEBUG]", "debug message"]);

    delete process.env.NIT_DEBUG;
});


test ("nit.inspect ()", () =>
{
    jest.resetModules ();
    const no_util = require ("util");

    let inspectData = [];
    let logData = [];
    let oldLog = console.log;

    console.log = function ()
    {
        logData.push (nit.array (arguments));
    };

    no_util.inspect = function (v)
    {
        inspectData.push (nit.array (arguments));
        return nit.clone (v);
    };

    nit.inspect ("str");
    expect (inspectData).toEqual ([]);
    expect (logData).toEqual ([["str"]]);

    nit.inspect ({ a: 3 }, { b: 4 });
    expect (inspectData).toEqual ([
        [{ a: 3 }, nit.INSPECT_DEFAULTS],
        [{ b: 4 }, nit.INSPECT_DEFAULTS]
    ]);
    expect (logData).toEqual ([["str"], [{ a: 3 }, { b: 4 }]]);

    console.log = oldLog;
});


test ("nit.isDir ()", () =>
{
    expect (nit.isDir (no_path.join (test.HOME, "test/resources/project-a"))).toBe (true);
    expect (nit.isDir (no_path.join (test.HOME, "test/resources/project-link"))).toBe (true);
    expect (nit.isDir (no_path.join (test.HOME, "test/setup.js"))).toBe (false);
    expect (nit.isDir (no_path.join (test.HOME, "test/abc"))).toBe (false);
});


test ("nit.resolvePackageRoot ()", () =>
{
    let root = nit.resolvePackageRoot (__dirname);
    expect (root).toBe (test.HOME);

    root = nit.resolvePackageRoot (__filename);
    expect (root).toBe (test.HOME);
    expect (nit.resolvePackageRoot ("/usr/local")).toBeUndefined ();
});


test ("nit.resolveAsset ()", () =>
{
    expect (nit.resolveAsset ("test/setup.js")).toBe (no_path.join (test.HOME, "test/setup.js"));
});


test ("nit.classNameToPath ()", () =>
{
    expect (nit.classNameToPath ("Work")).toBe ("Work.js");
    expect (nit.classNameToPath ("a.b.Work")).toBe ("a/b/Work.js");
});


test ("nit.resolvePath ()", () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();
    let nit = require (test.HOME);
    expect (nit.resolvePath ("Work.js")).toBe (no_path.join (testProjectPath, "lib/Work.js"));
});


test ("nit.readFile ()", () =>
{
    expect (nit.readFile ("test-config.json", true)).toBeUndefined ();
    expect (() => nit.readFile ("test-config.json")).toThrow (/file.*does not exist/);
    expect (nit.readFile ("test/resources/test-config.json")).toBe (`{
    "name": "test",
    "value": "a test value"
}
`);
});


test ("nit.readFileAsync ()", async () =>
{
    expect (await nit.readFileAsync ("test-config.json", true)).toBeUndefined ();
    expect (() => nit.readFileAsync ("test-config.json")).rejects.toThrow (/file.*does not exist/);
    expect (await nit.readFileAsync ("test/resources/test-config.json")).toBe (`{
    "name": "test",
    "value": "a test value"
}
`);
});


test ("nit.require ()", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();
    let nit = require (test.HOME);

    expect (nit.require ("Work")).toBeInstanceOf (Function);
    expect (nit.require ("Work")).toBeInstanceOf (Function);
    expect (() => nit.require ("Work2")).toThrow (/file.*does not exist/);
    expect (nit.require ("test/resources/test-config.json")).toEqual (
    {
        name: "test",
        value: "a test value"
    });

    expect (() => nit.require ("InvalidClass")).toThrow (/load error/);

    nit.require ("c");
    await nit.sleep (10);
    expect (nit.require ("d")).toBe ("d");

    nit.require ("A");
    expect (nit.require ("B")).toBeInstanceOf (Function);
});


test ("nit.require () - async classes", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();
    let nit = require (test.HOME);

    let a = await nit.new ("AsyncA");

    expect (a).toBeInstanceOf (nit.NS.AsyncA);
    expect (a.ab).toBeInstanceOf (nit.NS.AsyncB);
});


test ("nit.resolvePath ()", () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();
    let nit = require (test.HOME);
    expect (nit.resolvePath ("Work.js")).toBe (no_path.join (testProjectPath, "lib/Work.js"));
});


test ("nit.requireAll ()", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();
    let nit = require (test.HOME);

    let all = await nit.requireAll ("A", "B", "c", "d");

    expect (all[0]).toBeInstanceOf (Function);
    expect (all[0].name).toBe ("A");

    expect (all[1]).toBeInstanceOf (Function);
    expect (all[1].name).toBe ("B");

    expect (all[2]).toBeUndefined ();
    expect (all[3]).toBe ("d");

    jest.resetModules ();
    nit = require (test.HOME);
    all = await nit.requireAll ("A", "B");

    expect (all[0]).toBeInstanceOf (Function);
    expect (all[0].name).toBe ("A");

    expect (all[1]).toBeInstanceOf (Function);
    expect (all[1].name).toBe ("B");
});


test ("nit.requireModule ()", () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();
    let nit = require (test.HOME);

    expect (nit.requireModule ("hello")).toEqual ({ message: "hello" });
    expect (() => nit.requireModule ("AB")).toThrow (/cannot find module 'AB'/i);
});


test ("nit.lookupClass ()", () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();
    let nit = require (test.HOME);

    expect (() => nit.lookupClass ("d")).toThrow (/class 'd' is invalid/i);
});


test ("nit.initPackages ()", () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();
    let nit = require (test.HOME);

    expect (nit.__packageAInitialized).toBe (true);
});


test ("nit.loadConfig ()", () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();
    let nit = require (test.HOME);

    expect (nit.loadConfig ("project-config.json")).toEqual ({ name: "project-a" });
    expect (nit.loadConfig ("project-config-not-found.json", true)).toBeUndefined ();
    expect (() => nit.loadConfig ("project-config-not-found.json")).toThrow (/file.*project-config-not-found.*does not exist/);
});


test ("nit.loadConfigs ()", () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();
    let nit = require (test.HOME);

    expect (nit.CONFIG).toEqual (
    {
        env: "test",
        max:
        {
            upload:
            {
                files: 5,
                size: "20MB"
            }
        }
    });

    testProjectPath = no_path.join (test.HOME, "test/resources/project-b");
    process.env.NIT_PROJECT_PATHS = testProjectPath;
    jest.resetModules ();
    expect (() => require (test.HOME)).toThrow (/'@00-common' is not an object/);
});


test ("nit.ready ()", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-c");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();

    let exp = require (test.HOME);
    let nit = exp.nit;

    expect (nit.__projectCInitialized).toBeUndefined ();

    nit.preInit (function ()
    {
        expect (nit.__projectCInitialized).toBe (true);
    });

    let thisNit = nit;

    nit.ready (function (nit)
    {
        expect (nit.__projectCInitialized).toBe (2);
        expect (thisNit).toBe (nit);
    });

    await exp;
});


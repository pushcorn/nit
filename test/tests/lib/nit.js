const no_path = require ("path");


test ("nit getters", () =>
{
    expect (nit.READY).toBe (true);
    expect (nit.HOME).toBe (no_path.dirname (no_path.dirname (no_path.dirname (__dirname))));
    expect (nit.READY).toBe (true);
    expect (nit.DEBUG).toBe (false);
});


test ("nit.PROJECT_PATHS", async () =>
{
    let nit = await test.reloadNit ("test/resources");

    expect (nit.PROJECT_PATHS).toEqual ([
        no_path.join (test.HOME, "test/resources/home/test/.nit"),
        nit.path.join (test.HOME, "test/resources"),
        test.HOME
    ]);

    delete process.env.NIT_PROJECT_PATHS;
});


test ("nit.ASSET_PATHS", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    let nit = await test.reloadNit (testProjectPath);

    expect (nit.ASSET_PATHS).toEqual ([
        no_path.join (test.HOME, "test/resources/home/test/.nit"),
        testProjectPath,
        no_path.join (testProjectPath, "packages/package-a"),
        nit.NIT_HOME
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


test ("nit.resolveClass ()", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    let nit = await test.reloadNit (testProjectPath);

    expect (nit.resolveClass ("Work.js")).toBe (no_path.join (testProjectPath, "lib/Work.js"));
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


test ("nit.requireModule ()", () =>
{
    expect (nit.requireModule ("test/resources/test-config.json")).toEqual (
    {
        name: "test",
        value: "a test value"
    });

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
    expect (() => nit.require ("InvalidClass")).toThrow (/load error/);

    nit.require ("c");
    await nit.sleep (10);
    expect (nit.require ("d")).toBe ("d");

    nit.require ("A");
    expect (nit.require ("B")).toBeInstanceOf (Function);

    expect (nit.require ("data.json")).toEqual (
    {
        "data key": "data value"
    });
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
    expect (() => nit.requireModule ("AB")).toThrow (/the module 'AB' was not found/i);
});


test ("nit.lookupClass ()", () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    process.env.NIT_PROJECT_PATHS = testProjectPath;

    jest.resetModules ();
    let nit = require (test.HOME);

    expect (nit.lookupClass ("d")).toBeUndefined ();
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
    expect (() => nit.loadConfig ("project-config-not-found.json")).toThrow (/module.*project-config-not-found.*was not found/);
});


test ("nit.loadConfigs ()", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    let nit = await test.reloadNit (testProjectPath);

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


test ("nit.handlException ()", async () =>
{
    let logContent;

    nit._log = nit.log;
    nit.log = function ()
    {
        logContent = nit.array (arguments);
    };

    nit.handleException (new Error ("test error"));

    expect (logContent).toEqual (["[ERROR]", "test error"]);

    process.env.NIT_DEBUG = "true";
    const _nit = await test.reloadNit ();

    _nit.log = nit.log;
    _nit.handleException (new Error ("test error 2"));

    expect (logContent[0]).toBe ("[ERROR]");
    expect (logContent[1]).toMatch (/error: test error 2/i);

    nit.log = nit._log;
});


test ("nit.listComponentPaths", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    let nit = await test.reloadNit (testProjectPath);

    expect (nit.listComponentPaths ("commands"))
        .toEqual (
        [
        {
            path: no_path.join (testProjectPath, "/lib/commands"),
            classNamespace: "commands",
            namespace: ""
        }
        ])
    ;
});


test ("nit.listComponents", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    let nit = await test.reloadNit (testProjectPath);

    expect (nit.listComponents ("apis"))
        .toEqual (
        [
        {
            className: "apis.TestApi",
            cn: "test-api",
            name: "test-api",
            path: no_path.join (testProjectPath, "/lib/apis/TestApi.js"),
            namespace: ""
        }
        ,
        {
            className: "pkga.apis.Hello",
            cn: "pkga:hello",
            name: "hello",
            path: no_path.join (testProjectPath, "/packages/package-a/lib/pkga/apis/Hello.js"),
            namespace: "pkga"
        }
        ])
    ;
});


test ("nit.runCommand", async () =>
{
    function testRunCommand ()
    {
        const params = nit.typedArgsToObj (arguments,
        {
            command: "string",
            projectPath: "string"
        });

        params.projectPath = params.projectPath || test.pathForProject ("project-a");

        return nit.Queue ()
            .push (async function (ctx)
            {
                try
                {
                    ctx.nit = await test.setupCliMode (params);
                }
                catch (e)
                {
                    ctx.error = e;
                }
            })
        ;
    }

    await testRunCommand ("test-cmd", test.pathForProject ("project-c"))
        .lpush (function (ctx)
        {
            ctx.log = test.mockConsoleLog ();
        })
        .run ((ctx) =>
        {
            let nit = ctx.nit;

            expect (ctx.log.restore ()).toEqual (["Test command for project-c."]);

            Object.getOwnPropertyDescriptor (nit, "PROJECT_PATHS").get.reset ();

            nit.dpg (nit, "NIT_HOME", nit.path.join (test.pathForProject ("project-c"), "node_modules/@pushcorn/nit"), true);

            expect (nit.PROJECT_PATHS.filter (p => p.endsWith ("node_modules/@pushcorn/nit")).length).toBe (1);
            expect (nit.PROJECT_PATHS.filter (p => p.endsWith ("node_modules/@pushcorn/ui")).length).toBe (1);
        })
    ;

    await testRunCommand ("empty-result", test.pathForProject ("project-c"))
        .lpush (function (ctx)
        {
            ctx.log = test.mockConsoleLog ();
        })
        .run ((ctx) =>
        {
            expect (ctx.log.restore ()).toEqual ([]);
        })
    ;

    await testRunCommand ("test-cmd")
        .lpush (function (ctx)
        {
            ctx.log = test.mockConsoleLog ();
        })
        .run ((ctx) =>
        {
            expect (ctx.log.restore ()).toEqual (["This is the test command."]);
        })
    ;

    await testRunCommand ()
        .run ((ctx) =>
        {
            expect (ctx.error.message).toMatch (/please specify a command/i);
        })
    ;

    await testRunCommand ("non-command")
        .run ((ctx) =>
        {
            expect (ctx.error.message).toMatch (/command.*not found/i);
        })
    ;

    await testRunCommand ("invalid-cmd")
        .run ((ctx) =>
        {
            expect (ctx.error.message).toMatch (/command.*not an instance of nit.Command/i);
        })
    ;
});


test ("nit.beep ()", () =>
{
    function beep (times, cb)
    {
        const write = process.stderr.write;
        let beeps;

        process.stderr.write = function (b)
        {
            beeps = b;
        };

        nit.beep (times);
        process.stderr.write = write;
        cb (beeps);
    }

    beep (null, function (beeps)
    {
        expect (beeps === "\x07").toBe (true);
    });

    beep (3, function (beeps)
    {
        expect (beeps === "\x07".repeat (3)).toBe (true);
    });
});

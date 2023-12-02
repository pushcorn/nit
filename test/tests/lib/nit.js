const no_path = require ("path");


test ("nit.resetRequireCache ()", async () =>
{
    let path = no_path.join (test.pathForProject ("project-a"), "lib/Work");
    let d1 = nit.require (path).loadedAt;
    let d2 = nit.require (path).loadedAt;

    await nit.sleep (5);
    nit.resetRequireCache ();

    let Work = nit.require (path);
    let d3 = Work.loadedAt;

    expect (d1).toBe (d2);
    expect (d2).not.toBe (d3);
    expect (nit.CLASSES.Work).toBe (Work);

    nit.resetRequireCache (/^Work/);
    expect (nit.CLASSES.Work).toBeUndefined ();

    nit.require (path);
    nit.resetRequireCache (n => n == "Work");
    expect (nit.CLASSES.Work).toBeUndefined ();

    nit.require (path);
    nit.resetRequireCache ("Work");
    expect (nit.CLASSES.Work).toBeUndefined ();
});


test ("nit getters", () =>
{
    expect (nit.READY).toBe (true);
    expect (nit.HOME).toBe (no_path.dirname (no_path.dirname (no_path.dirname (__dirname))));
    expect (nit.READY).toBe (true);
    expect (nit.SHUTDOWN).toBe (false);
});


test ("nit.PROJECT_PATHS", async () =>
{
    let nit = await test.reloadNit (".");

    expect (nit.PROJECT_PATHS).toEqual ([
        no_path.join (test.HOME, "test/resources/home/test/.nit"),
        no_path.join (test.HOME, "test"),
        no_path.join (test.HOME, "test/resources"),
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
        no_path.join (test.HOME, "test"),
        testProjectPath,
        no_path.join (testProjectPath, "packages/package-a"),
        no_path.join (testProjectPath, "packages/package-b"),
        nit.HOME
    ]);

    delete process.env.NIT_PROJECT_PATHS;
});


test ("nit.PATH_ALIASES", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    let nit = await test.reloadNit (testProjectPath);

    expect (nit.PATH_ALIASES).toEqual (
    {
        "@pushcorn/nit": nit.HOME,
        "@test/project-a": no_path.join (testProjectPath, "packages/package-a")
    });

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


test ("nit.isDirAsync ()", async () =>
{
    expect (await nit.isDirAsync (no_path.join (test.HOME, "test/resources/project-a"))).toBe (true);
    expect (await nit.isDirAsync (no_path.join (test.HOME, "test/resources/project-link"))).toBe (true);
    expect (await nit.isDirAsync (no_path.join (test.HOME, "test/setup.js"))).toBe (false);
    expect (await nit.isDirAsync (no_path.join (test.HOME, "test/abc"))).toBe (false);
});


test ("nit.isFile ()", () =>
{
    expect (nit.isFile (no_path.join (test.HOME, "test/resources/project-a"))).toBe (false);
    expect (nit.isFile (no_path.join (test.HOME, "test/resources/project-a/nit.json"))).toBe (true);
    expect (nit.isFile (no_path.join (test.HOME, "test/resources/project-a/abcd"))).toBe (false);
});


test ("nit.isFileAsync ()", async () =>
{
    expect (await nit.isFileAsync (no_path.join (test.HOME, "test/resources/project-a"))).toBe (false);
    expect (await nit.isFileAsync (no_path.join (test.HOME, "test/resources/project-a/nit.json"))).toBe (true);
    expect (await nit.isFileAsync (no_path.join (test.HOME, "test/resources/project-a/abcd"))).toBe (false);
});


test ("nit.resolvePath ()", () =>
{
    expect (nit.resolvePath ()).toBeUndefined ();
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
    expect (nit.resolveAsset ("resources/jest/setup.js")).toBe (no_path.join (test.HOME, "resources/jest/setup.js"));
});



test ("nit.resolveAssetDir ()", () =>
{
    expect (nit.resolveAssetDir ("resources/jest")).toBe (no_path.join (test.HOME, "resources/jest"));
});


test ("nit.fileEncodingForContent ()", () =>
{
    expect (nit.fileEncodingForContent ("text")).toBe ("utf8");
    expect (nit.fileEncodingForContent ("text", null)).toBe (null);
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


test ("nit.readStream ()", async () =>
{
    let pkgStream = nit.fs.createReadStream (nit.resolveAsset ("package.json"));
    let content = await nit.readStream (pkgStream);
    expect (JSON.parse (content).name).toBe ("@pushcorn/nit");

    pkgStream = nit.fs.createReadStream (nit.resolveAsset ("package.json"));
    content = await nit.readStream (pkgStream, null);
    expect (content).toBeInstanceOf (Buffer);

    const no_stream = require ("stream");

    async function *generate ()
    {
        yield "1";
        throw new Error ("ERR!");
    }

    let readable = no_stream.Readable.from (generate ());

    expect (() => nit.readStream (readable)).rejects.toThrow ("ERR!");
});


test ("nit.requireModule ()", () =>
{
    expect (nit.requireModule ("test/resources/test-config.json")).toEqual (
    {
        name: "test",
        value: "a test value"
    });

    expect (() => nit.requireModule ("jest-this")).toThrow (/module.*not found/);
    expect (() => nit.requireModule ("test/resources/invalid.js")).toThrow (/parsing error/);
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
    expect (nit.projectExtenstionLoaded).toBe (true);

    expect (nit.require ("", true)).toBeUndefined ();
    expect (() => nit.require ()).toThrow (/file '' does not exist/i);

    nit.require ("c");
    nit.require ("Eee");
    await nit.sleep (10);
    expect (nit.require ("d")).toBe ("d");
    expect (nit.require ("Eee")).toBeInstanceOf (Function);

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

    expect (nit.lookupClass ("d")).toBeInstanceOf (Promise);
});


test ("nit.listPackageDirs ()", () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");

    expect (nit.listPackageDirs (testProjectPath).map (d => d.path)).toEqual (
    [
        nit.path.join (testProjectPath, "packages/package-a"),
        nit.path.join (testProjectPath, "packages/package-b")
    ]);
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

    nit.log.e = nit._log.e;
    nit.log.formatMessage = nit._log.formatMessage;

    const _nit = await test.reloadNit ();

    _nit.log = nit.log;
    _nit.handleException (new Error ("test error"));

    expect (logContent[0]).toBe ("[ERROR]");
    expect (logContent[1]).toBe ("test error");

    _nit.debug ("nit");
    _nit.handleException (new Error ("test error"));
    expect (logContent[0]).toBe ("[DEBUG] (nit)");

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
            path: no_path.join (testProjectPath, "lib/commands"),
            classNamespace: "commands",
            namespace: ""
        }
        ,
        {
            path: no_path.join (nit.HOME, "lib/commands"),
            classNamespace: "commands",
            namespace: ""
        }
        ])
    ;
});


test ("nit.listComponents ()", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    let nit = await test.reloadNit (testProjectPath);

    expect (nit.clone (nit.listComponents ("apis")))
        .toEqual (expect.arrayContaining (
        [
            expect.objectContaining (
            {
                className: "apis.TestApi",
                name: "test-api",
                path: no_path.join (testProjectPath, "/lib/apis/TestApi.js"),
                namespace: ""
            })
            ,
            expect.objectContaining (
            {
                className: "pkga.apis.Hello",
                name: "pkga:hello",
                path: no_path.join (testProjectPath, "/packages/package-a/lib/pkga/apis/Hello.js"),
                namespace: "pkga"
            })
            ,
            expect.objectContaining (
            {
                className: "pkga.apis.World",
                name: "pkga:world",
                path: no_path.join (testProjectPath, "/packages/package-a/lib/pkga/apis/World.js"),
                namespace: "pkga"
            })
        ]))
    ;

    expect (nit.listComponents ("apis", true)).toEqual (["test-api", "pkga:hello", "pkga:world"]);
});


test ("nit.listCommands ()", async () =>
{
    const nit = await test.reloadNit ("project-a");
    let commands = nit.clone (nit.listCommands ());

    expect (commands).toEqual (expect.arrayContaining (
    [
    {
        class: nit.lookupClass ("commands.InvalidCmd"),
        path: test.pathForProject ("project-a/lib/commands/InvalidCmd.js"),
        category: "commands",
        name: "invalid-cmd",
        className: "commands.InvalidCmd",
        namespace: ""
    }
    ]));

    expect (nit.listCommands (true)).toEqual (expect.arrayContaining (["invalid-cmd"]));
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
                ctx.nit = await test.setupCliMode (params);
            })
        ;
    }


    await testRunCommand ("test-cmd", test.pathForProject ("project-c"))
        .lpush (function (ctx)
        {
            ctx.mock = test.mock (console, "log");
        })
        .run ((ctx) =>
        {
            let nit = ctx.nit;

            expect (ctx.mock.invocations[0].args).toEqual (["Test command for project-c."]);

            Object.getOwnPropertyDescriptor (nit, "PROJECT_PATHS").get.reset ();

            nit.dpg (nit, "HOME", nit.path.join (test.pathForProject ("project-c"), "node_modules/@pushcorn/nit"), true);

            expect (nit.PROJECT_PATHS.filter (p => p.endsWith ("node_modules/@pushcorn/nit")).length).toBe (1);
            expect (nit.PROJECT_PATHS.filter (p => p.endsWith ("node_modules/@pushcorn/ui")).length).toBe (1);
        })
    ;

    await testRunCommand ("empty-result", test.pathForProject ("project-c"))
        .lpush (function (ctx)
        {
            ctx.mock = test.mock (console, "log");
        })
        .run ((ctx) =>
        {
            expect (ctx.mock.invocations).toEqual ([]);
        })
    ;

    await testRunCommand ("test-cmd")
        .lpush (function (ctx)
        {
            ctx.mock = test.mock (console, "log");
        })
        .run ((ctx) =>
        {
            expect (ctx.mock.invocations[0].args).toEqual (["This is the test command."]);
        })
    ;

    await testRunCommand ("non-command")
        .failure ((ctx) =>
        {
            expect (ctx.error.message).toMatch (/command.*not found/i);
        })
        .run ()
    ;

    await testRunCommand ("invalid-cmd")
        .failure ((ctx) =>
        {
            expect (ctx.error.message).toMatch (/command.*not an instance of nit.Command/i);
        })
        .run ()
    ;


    await testRunCommand ("return-obj")
        .lpush (function (ctx)
        {
            ctx.mock = test.mock (console, "log");
        })
        .run ((ctx) =>
        {
            expect (ctx.mock.invocations[0].args[0]).toEqual ({ value: 100 });
        })
    ;

    nit.require ("nit.Command");

    let Console = nit.require ("commands.Console");
    let mock = test.mock (nit, "lookupCommand", function ()
    {
        return Console;
    });

    Console.onRun (nit.noop);
    await nit.runCommand ();
    expect (mock.invocations[0].args).toEqual (["console"]);
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

    let mock = test.mock (nit, "log");

    beep (null, function (beeps)
    {
        expect (mock.invocations[0].args[0]).toBe ("\x1b[1m\x1b[31m\x1b[39m\x1b[22m");
        expect (beeps === "\x07").toBe (true);
    });

    mock = test.mock (nit, "log");

    beep (3, function (beeps)
    {
        expect (mock.invocations.length).toBe (0);
        expect (beeps === "\x07".repeat (3)).toBe (true);
    });

    mock.restore ();
});


test ("nit.ComponentDescriptor", async () =>
{
    const nit = await test.setupCliMode ("", "project-a", true);
    const TestCmd = nit.lookupCommand ("test-cmd");
    const HelloWorld = nit.lookupCommand ("hello-world");

    let cd1 = nit.getComponentDescriptor (TestCmd);
    let cd2 = nit.getComponentDescriptor (HelloWorld);

    expect (cd1.name).toBe ("test-cmd");
    expect (cd1.compareTo (cd2)).toBe (1);
    expect (cd1.compareTo (cd1)).toBe (0);

    let apis = nit.listComponents ("apis");

    let cd3 = nit.find (apis, "name", "pkga:hello");
    let cd4 = nit.find (apis, "name", "pkga:world");

    expect (cd4.compareTo (cd3)).toBe (1);
    expect (cd4.compareTo (cd1)).toBe (1);

    let cd5 = nit.getComponentDescriptor ("commands.TestCmd");

    expect (cd5).toBe (cd1);
});


test ("nit.runCompgen ()", async () =>
{
    let mock = test.mock (console, "log");
    const nit = await test.setupCompletionMode ("project-a");

    await nit.runCompgen ();

    expect (mock.invocations[0].args).toEqual (["NONE"]);
});


test ("nit.lookupCommand ()", async () =>
{
    const nit = await test.reloadNit ("project-c");

    nit.require ("nit.Command");

    expect (() => nit.lookupCommand ("error-cmd")).toThrow (/error loading command/);
    expect (() => nit.lookupCommand ("invalid-type-command")).toThrow (/component.*InvalidPlugin.*not found/i);
    expect (nit.lookupCommand ("not-found-command", true)).toBeUndefined ();
});


test ("nit.lookupComponents ()", async () =>
{
    const nit = await test.reloadNit ("project-a");

    nit.require ("nit.Command");

    let commands = nit.lookupComponents ("commands", nit.Command);
    expect (commands.every (c => nit.is.subclassOf (c, nit.Command))).toBe (true);

    commands = nit.lookupComponents ("commands", "nit.Command");
    expect (commands.every (c => nit.is.subclassOf (c, nit.Command))).toBe (true);

    commands = nit.lookupComponents (nit.Command);
    expect (commands.every (c => nit.is.subclassOf (c, nit.Command))).toBe (true);
});


test ("nit.absPath ()", () =>
{
    expect (nit.absPath ("aa/bb")).toBe (nit.path.join (nit.HOME, "aa/bb"));
    expect (nit.absPath ("~/aa/bb")).toBe (nit.path.join (nit.USER_HOME, "aa/bb"));
    expect (nit.absPath ("//aa//bb")).toBe ("/aa/bb");
});


test ("nit arg expander: configFile", () =>
{
    nit.config ("test.config..configFile", "test/resources/test-config.json");

    expect (nit.CONFIG.test.config).toEqual ({
        "name": "test",
        "value": "a test value"
    });
});

test ("nit arg expander: file", () =>
{
    nit.config ("test.config..file", "test/resources/test-config.json");

    expect (nit.CONFIG.test.config).toBe (`{
    "name": "test",
    "value": "a test value"
}
`);
});

test ("nit arg expander: fileAsync", async () =>
{
    await nit.config ("test.config..fileAsync", "test/resources/test-config.json");

    expect (nit.CONFIG.test.config).toBe (`{
    "name": "test",
    "value": "a test value"
}
`);
});


test ("nit.Compgen completers", async () =>
{
    let logContent;

    process.env.COMP_LINE = "command";
    process.env.COMP_POINT = "command".length;
    process.argv = ["node", global.nit.HOME];
    console.log = function () { logContent = global.nit.array (arguments); };

    await test.reloadNit ();
    expect (logContent).toEqual (["NONE"]);
});


test ("nit.Object type registration", () =>
{
    const Copy = nit.defineClass ("Copy")
        .field ("[from]", "file")
    ;

    expect (new Copy ("aa").from).toBe ("aa");
    expect (new Copy ().from).toBe ("");

    let copy = new Copy ();

    expect (() => (copy.from = {})).toThrow (/should be a file/);
    expect (() => (copy.from = Copy)).toThrow (/should be a file/);

    const CopyDir = nit.defineClass ("CopyDir")
        .field ("[from]", "dir")
    ;

    expect (new CopyDir ("aa").from).toBe ("aa");

    let copyDir = new CopyDir ();

    expect (() => (copyDir.from = {})).toThrow (/should be a dir/);
    expect (() => (copyDir.from = CopyDir)).toThrow (/should be a dir/);
});


test ("nit.Object.use ()", () =>
{
    const B = nit.defineClass ("B");
    const A = nit.defineClass ("A")
        .use ("B")
        .use ("nit.Dir")
        .use ("nit:function", "test.strategies", "nit.test.Strategy")
        .use ("path")
        .use ("*http")
        .use (["pkg", "package.json"])
    ;

    expect (A.Dir).toBe (nit.Dir);
    expect (A.Function).toBe (nit.test.strategies.Function);
    expect (A.B).toBe (B);
    expect (A.path).toBe (require ("path"));
    expect (A.http).toBe (require ("http"));
    expect (A.pkg).toEqual (expect.objectContaining ({ bin: "./bin/nit" }));
});


test ("nit.Object.use ()", async () =>
{
    let testProjectPath = no_path.join (test.HOME, "test/resources/project-a");
    let nit = await test.reloadNit (testProjectPath);

    const A = nit.defineClass ("A")
        .use ("resources/models/Version.v1.js")
        .use ("resources/mimeTypes.json")
    ;

    expect (nit.get (A, "Version.VERSION")).toBe ("v1");
    expect (nit.get (A, "mimeTypes")).toEqual (
    {
        "application/json":
        {
            "source": "iana",
            "charset": "UTF-8",
            "compressible": true,
            "extensions": ["json","map"]
        }
    });
});


test ("nit.shutdown ()", async () =>
{
    const nit = await test.reloadNit ();

    let shutdownCalled = 0;

    nit.shutdown (() =>
    {
        ++shutdownCalled;
    });

    process.emit ("SHUTDOWN");

    expect (shutdownCalled).toBe (1);

    process.emit ("SHUTDOWN");

    expect (shutdownCalled).toBe (1);
});

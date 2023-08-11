const CWD = process.cwd ();

process.setMaxListeners (0);
process.stdout.isTTY = true;

afterAll (async () =>
{
    process.chdir (CWD);

    for (let listener of process.listeners ("SHUTDOWN"))
    {
        await listener ();
    }
});


test.unexpectedErrors = [];


test.nit = function ()
{
    const path = require ("path");
    const os = require ("os");
    const home = path.dirname (path.dirname (__dirname));

    os._homedir = os.homedir;
    os.homedir = function () { return path.join (home, "test/resources/home/test"); };

    test.HOME = home;
    test.PUBLIC_NIT_PATH = path.join (home, "public/lib/nit.js");
    test.ORIGINAL_NIT_PROJECT_PATHS = process.env.NIT_PROJECT_PATHS || "";
    test.TEST_PROJECT_PATH = path.join (process.cwd (), "test");

    process._argv = process.argv;
    process.argv = [];
    process.env.NIT_PROJECT_PATHS = test.ORIGINAL_NIT_PROJECT_PATHS + ":" + test.TEST_PROJECT_PATH;
    jest.resetModules ();

    const nit = require (home);
    const Strategy = nit.require ("nit.test.Strategy");

    nit.require ("nit.test.Mock");

    nit
        .lookupComponents ("strategies", Strategy)
        .forEach (cls =>
        {
            test[nit.camelCase (cls.name.split (".").pop ())] = cls;
        })
    ;

    return nit;
};


test.log = console.log.bind (console);


test.pathForProject = function (name)
{
    return nit.path.isAbsolute (name) ? name : nit.path.join (test.TEST_PROJECT_PATH, "resources", name);
};


test.reloadNit = async function (projectPath)
{
    jest.resetModules ();
    process.env.NIT_PROJECT_PATHS = test.TEST_PROJECT_PATH;

    if (projectPath)
    {
        process.env.NIT_PROJECT_PATHS += ":" + test.pathForProject (projectPath);
    }

    const nit = await require (test.HOME);

    if (projectPath)
    {
        const nitPackagesPaths = nit.PACKAGE_SUBDIRS.map (d => nit.path.join (test.HOME, d));

        nit.arrayRemove (nit.ASSET_PATHS, function (p)
        {
            return nitPackagesPaths.some (pp => p.startsWith (pp));
        });

        nit.arrayRemove (nit.CLASS_PATHS, function (p)
        {
            return nitPackagesPaths.some (pp => p.startsWith (pp));
        });
    }

    return nit;
};


test.setupCompletionMode = async function ()
{
    let { compLine, compPoint, projectPath } = global.nit.typedArgsToObj (arguments,
    {
        compLine: "string",
        compPoint: "integer",
        projectPath: "string"
    });

    const nit = await test.reloadNit (projectPath);
    const words = [];

    let lastIndex = 0,
        compCword = -1;

    compPoint = compPoint || compLine.length;

    compLine.replace (/\s+/g, function (match, index)
    {
        if (index <= compPoint)
        {
            compCword = words.length;
        }

        words.push (compLine.slice (lastIndex, index));
        lastIndex = index + match.length;
    });

    if (lastIndex < compLine.length)
    {
        if (lastIndex <= compPoint)
        {
            compCword = words.length;
        }

        words.push (compLine.slice (lastIndex));
    }
    else
    if (compLine.match (/\s+$/) && compPoint == compLine.length)
    {
        compCword = words.length;
        words.push ("");
    }

    let cur, prev;

    if (compCword < 0)
    {
        compCword = words.length - 1;
    }

    cur = words[compCword];
    prev = words[compCword - 1];

    if (compPoint < compLine.length && compLine[compPoint - 1] == " ")
    {
        cur = "";
    }
    else
    if (cur.match (/^[0-9&<>]+$/))
    {
        cur = "";
    }

    const ENV =
    {
        COMP_CUR: cur,
        COMP_PREV: prev
    };

    for (let [i, word] of words.entries ())
    {
        ENV["COMP_WORD_" + i] = word;
    }

    nit
        .require ("nit.Compgen")
        .require ("nit.compgen.completers.File")
        .require ("nit.compgen.completers.Dir")
        .require ("nit.compgen.completers.Choice")
    ;

    nit.dpgs (nit,
    {
        ARGV: ["nit", ENV.COMP_CUR, ENV.COMP_PREV],
        ENV:
        {
            ...ENV,
            COMP_CWORD: compCword,
            COMP_KEY: "9",
            COMP_LINE: compLine,
            COMP_NUM_WORDS: words.length,
            COMP_POINT: compPoint,
            COMP_TYPE: "33"
        }
    });

    return nit;
};


test.setupCliMode = async function ()
{
    let { command, projectPath, initOnly } = global.nit.typedArgsToObj (arguments,
    {
        command: "string",
        projectPath: "string",
        initOnly: "boolean"
    });

    if (!initOnly)
    {
        process.argv = ["node", global.nit.HOME].concat (command || []);
    }
    else
    {
        process.argv = [];
    }

    const nit = await test.reloadNit (projectPath);

    if (initOnly)
    {
        nit.require ("nit.Command");
    }

    return nit;
};


test.mock = function (object, method, mockFn, count)
{
    count = count || 1;

    if (!(mockFn instanceof Function))
    {
        let retval = mockFn;

        mockFn = function ()
        {
            return retval;
        };
    }

    let mock =
    {
        invocations: [],
        originalMethod: object[method],
        restore: function ()
        {
            object[method] = mock.originalMethod;
        }
    }

    object[method] = function ()
    {
        --count;

        let result, error, args = Array.prototype.slice.call (arguments);

        try
        {
            return (result = mockFn.apply (object, args));
        }
        catch (e)
        {
            error = e;
        }
        finally
        {
            mock.invocations.push ({ result, error, args });

            if (!count)
            {
                mock.restore ();
            }

            if (error)
            {
                throw error;
            }
        }
    };

    return mock;
};


global.nit = test.nit ()
    .do (nit =>
    {
        let counter = 0;

        nit.bx = function ()
        {
            nit.beep (...arguments);
            process.exit (0);
        };


        nit.bx.count = function (max, ...args)
        {
            nit.beep (...args);

            if (++counter > max)
            {
                process.exit (0);
            }
        };
    })
;

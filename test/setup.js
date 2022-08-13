const CONSOLE_LOG = console.log;


test.nit = function ()
{
    const path = require ("path");
    const os = require ("os");
    const home = path.dirname (__dirname);

    os._homedir = os.homedir;
    os.homedir = function () { return path.join (home, "test/resources/home/test"); };

    process._argv = process.argv;
    process.argv = [];
    process.chdir (home);
    jest.resetModules ();

    test.HOME = home;
    test.PUBLIC_NIT_PATH = path.join (home, "public/nit.js");

    return require (process.cwd ());
};


test.pathForProject = function (name)
{
    return nit.path.join (test.HOME, "test/resources", name);
};


test.reloadNit = async function (projectPath)
{
    const path = require ("path");

    jest.resetModules ();
    process.env.NIT_PROJECT_PATHS = "";

    if (projectPath)
    {
        if (projectPath[0] != path.sep)
        {
            projectPath = path.join (test.HOME, projectPath);
        }

        process.env.NIT_PROJECT_PATHS = projectPath;
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
    let { command, projectPath } = global.nit.typedArgsToObj (arguments,
    {
        command: "string",
        projectPath: "string"
    });

    process.argv = ["node", global.nit.NIT_HOME].concat (command || []);

    return await test.reloadNit (projectPath);
};


test.mockConsoleLog = function (all)
{
    function log ()
    {
        let args = nit.array (arguments);

        if (all)
        {
            log.data.push (args);
        }
        else
        {
            log.data = args;
        }
    }

    log.data = [];

    log.restore = function ()
    {
        console.log = CONSOLE_LOG;

        return log.data;
    };

    return console.log = log;
};


global.nit = test.nit ();

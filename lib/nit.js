const nit = require ("../public/lib/nit");
const SHUTDOWN_QUEUE = nit.Queue ();

let REQUIRE_CACHE = {};
let SHUTDOWN = false;

// supported env vars
//    - NIT_CLASS_SUBDIRS string "A comma, space or colon separated list of subdirs that contains the class or JS files."
//    - NIT_DEBUG string "The class patterns separated by ':' for nit.debug ()."
//    - NIT_PACKAGE_SUBDIRS string "A comma, space or colon separated list of project subdirs that contains the packages."
//    - NIT_PROJECT_PATHS string "A colon separated list of project paths."
nit
    .m ("error.file_not_found", "The file '%{path}' does not exist.")
    .m ("error.module_not_found", "The module '%{path}' was not found.")
    .m ("error.invalid_config_section", "The section '%{section}' is not an object. (Given: %{value|nit.serialize})")
    .m ("error.command_not_found", "The command '%{command}' was not found.")
    .m ("error.invalid_command", "The command '%{command}' is not an instance of nit.Command.")

    .registerArgExpander ("configFile", function (path)
    {
        return nit.loadConfig (path);
    })
    .registerArgExpander ("file", function (path)
    {
        return nit.readFile (path);
    })
    .registerArgExpander ("fileAsync", async function (path)
    {
        return await nit.readFileAsync (path);
    })
;


nit.ComponentDescriptor
    .field ("path", "string", "The component file path.")
;


nit.Object
    .do ("use", use =>
    {
        use.parsers.push (
            function requireModule (property, name)
            {
                if (name[0] == "*")
                {
                    name = name.slice (1);

                    let [n, p] = nit.kvSplit (name, ".");

                    property = property || p || n;

                    return nit.dpv (() => nit.get (nit.requireModule (n), p), "name", property);
                }
            }
            ,
            function requireAsset (property, name)
            {
                let o;

                if (name.match (/\.(js|json)$/)
                    && (o = nit.requireAsset (name, true)))
                {
                    property = property || nit.is.func (o) && o.name && o.name.split (".").pop () || nit.path.parse (name).name;

                    return nit.dpv (() => o, "name", property);
                }
            }
            ,
            function require (property, name)
            {
                property = property || name;

                return nit.dpv (() => nit.require (name, true) || nit.requireModule (name), "name", property);
            }
        );
    })
;


nit.dpgs (nit,
{
    CWD: process.cwd (),
    ENV: process.env,
    ARGV: process.argv.slice (2),
    DEFAULT_PACKAGE_SUBDIRS: "packages",
    DEFAULT_CLASS_SUBDIRS: "lib public/lib",
    SHUTDOWN_EVENTS: ["SIGTERM", "SIGINT", "SIGHUP", "SIGQUIT", "SHUTDOWN"],
    UNEXPECTED_ERROR_EVENTS: ["unhandledRejection", "uncaughtException"],
    HOME: nit.memoize (function ()
    {
        return nit.path.dirname (__dirname);
    })
    ,
    USER_HOME: nit.memoize (function ()
    {
        return nit.os.homedir ();
    })
    ,
    SHUTDOWN: function ()
    {
        return SHUTDOWN;
    }
    ,
    CLI_MODE: nit.memoize (function ()
    {
        return process.argv[1] == nit.HOME;
    })
    ,
    COMPLETION_MODE: nit.memoize (function ()
    {
        return "COMP_LINE" in nit.ENV;
    })
    ,
    PROJECT_PATHS: nit.memoize (function ()
    {
        let paths =
        [
            nit.path.join (nit.USER_HOME, ".nit"),
            ...nit.trim (nit.ENV.NIT_PROJECT_PATHS).split (":"),
            nit.resolvePackageRoot (),
            nit.HOME

        ].filter (nit.is.not.empty);

        if (nit.HOME.includes ("node_modules"))
        {
            let dir = nit.path.dirname (nit.HOME);

            paths.push (...nit.fs.readdirSync (dir, { withFileTypes: true })
                .filter (d => d.isDirectory () && (d.path = nit.path.join (d.path, d.name)) && d.path != nit.HOME)
                .map (d => d.path)
            );
        }

        return nit.arrayUnique (paths)
            .filter (p => nit.isDir (p))
        ;
    })
    ,
    PATH_ALIASES: nit.memoize (function ()
    {
        let aliases = {};

        nit.each (nit.ASSET_PATHS, (p, pkg) =>
        {
            if (nit.fs.existsSync (pkg = nit.path.join (p, "package.json")))
            {
                pkg = require (pkg);

                if (pkg.name)
                {
                    aliases[pkg.name] = p;
                }
            }
        });

        return aliases;
    })
    ,
    PACKAGE_SUBDIRS: nit.memoize (function ()
    {
        let subdirs = nit.ENV.NIT_PACKAGE_SUBDIRS || nit.DEFAULT_PACKAGE_SUBDIRS;

        return subdirs.split (/[ :,]/);
    })
    ,
    CLASS_SUBDIRS: nit.memoize (function ()
    {
        let subdirs = nit.ENV.NIT_CLASS_SUBDIRS || nit.DEFAULT_CLASS_SUBDIRS;

        return subdirs.split (/[ :,]/);
    })
    ,
    ASSET_PATHS: nit.memoize (function ()
    {
        let paths = [];

        for (let p of nit.PROJECT_PATHS)
        {
            paths.push (p);

            for (let g of nit.PACKAGE_SUBDIRS)
            {
                g = nit.path.join (p, g);

                if (nit.isDir (g))
                {
                    paths.push (...nit.fs.readdirSync (g, { withFileTypes: true })
                        .filter (d => d.isDirectory ())
                        .map (d => d.path = nit.path.join (d.path, d.name))
                    );
                }
            }
        }

        return nit.arrayUnique (paths);
    })
    ,
    CLASS_PATHS: nit.memoize (function ()
    {
        let paths = [];

        for (let p of nit.ASSET_PATHS)
        {
            for (let c of nit.CLASS_SUBDIRS)
            {
                c = nit.path.join (p, c);

                if (nit.isDir (c))
                {
                    paths.push (c);
                }
            }
        }

        return paths;
    })
    ,
    INSPECT_DEFAULTS:
    {
        depth:    20,
        colors:   process.stdout.isTTY,
        compact:  false,
        sorted:   false,
        maxArrayLength: null
    }
    ,
    crypto: require ("crypto"),
    fs: require ("fs"),
    os: require ("os"),
    path: require ("path"),
    url: require ("url"),
    util: require ("util")

}, true);


global.crypto = nit.coalesce (nit.crypto.webcrypto, nit.crypto);


nit.dpvs (nit,
{
    beep: function (times)
    {
        let args = nit.array (arguments);

        if (typeof times == "number")
        {
            times = ~~args.shift ();
        }
        else
        {
            times = 1;
        }

        if (args.length)
        {
            let message = nit.argsToInspectData (args, { colors: false }).join (" ");

            nit.log ("\x1b[1m\x1b[31m" + message + "\x1b[39m\x1b[22m");
        }

        process.stderr.write ("\x07".repeat (times));
    }
    ,
    handleException: function (err)
    {
        nit.UNEXPECTED_ERROR_EVENTS.forEach (event => process.removeListener (event, nit.handleException));

        process.exitCode = 1;

        nit.log.e (err.message);
        nit.debug ("nit", err.stack);
    }
    ,
    shutdown: function ()
    {
        nit.array (arguments)
            .forEach (function (task)
            {
                SHUTDOWN_QUEUE.push (() => nit.ns.invoke (task));
            })
        ;

        return SHUTDOWN ? SHUTDOWN_QUEUE.run (() => nit) : nit;
    }
    ,
    argsToInspectData: function (args, options)
    {
        return nit.array (args).map ((v) => (nit.is.str (v) ? v : nit.util.inspect (nit.clone (v), nit.assign ({}, nit.INSPECT_DEFAULTS, options))));
    }
    ,
    inspect: function ()
    {
        console.log (...nit.argsToInspectData (arguments));
    }
    ,
    isDir: function (path)
    {
        try
        {
            return nit.fs.statSync (path).isDirectory ();
        }
        catch (e)
        {
            return false;
        }
    }
    ,
    isFile: function (path)
    {
        try
        {
            return nit.fs.statSync (path).isFile ();
        }
        catch (e)
        {
            return false;
        }
    }
    ,
    isDirAsync: async function (path)
    {
        try
        {
            return (await nit.fs.promises.stat (path)).isDirectory ();
        }
        catch (e)
        {
            return false;
        }
    }
    ,
    isFileAsync: async function (path)
    {
        try
        {
            return (await nit.fs.promises.stat (path)).isFile ();
        }
        catch (e)
        {
            return false;
        }
    }
    ,
    resolvePackageRoot: function (file)
    {
        file = file || nit.fs.realpathSync (nit.CWD);

        var path = nit.isDir (file) ? file : nit.path.dirname (file);
        var last;

        while (path != last)
        {
            last = path;

            if (nit.fs.existsSync (nit.path.join (path, "package.json")) && !path.includes ("node_modules"))
            {
                return nit.fs.realpathSync (nit.path.resolve (path));
            }

            path = nit.path.dirname (path);
        }
    }
    ,
    classNameToPath: function (cn) // eslint-disable-line no-unused-vars
    {
        cn = nit.trim (cn);

        if (cn.includes (nit.path.sep)
            || cn.match (/\.(js|json)$/))
        {
            return cn;
        }

        let [ns, sn] = nit.kvSplit (cn, ".", true);

        // normalize the basename if the class is namespaced (e.g., a.b.Class)

        return (ns ? (ns + "." + nit.pascalCase (sn)) : sn).replace (/\./g, nit.path.sep) + ".js";
    }
    ,
    absPath: function (path)
    {
        path = nit.path.normalize (path);

        if (path.startsWith ("~" + nit.path.sep))
        {
            path = nit.USER_HOME + path.slice (1);
        }

        if (!nit.path.isAbsolute (path))
        {
            path = nit.path.join (process.cwd (), path);
        }

        return path;
    }
    ,
    resolvePath: function (path, options)
    {
        if (nit.is.undef (path))
        {
            return;
        }

        let parsed = nit.path.parse (path);

        try
        {
            return parsed.root && nit.fs.existsSync (path) ? path : nit.fs.realpathSync (require.resolve (path, options));
        }
        catch (e)
        {
            if (!path.startsWith ("./") && (!parsed.root || !parsed.dir))
            {
                return nit.resolvePath ("./" + path, options);
            }
        }
    }
    ,
    resolveAssetDir: function (dir)
    {
        for (let p of nit.ASSET_PATHS)
        {
            let d = nit.path.join (p, dir);

            if (nit.isDir (d))
            {
                return d;
            }
        }
    }
    ,
    resolveAsset: function (path)
    {
        return nit.resolvePath (path, { paths: nit.ASSET_PATHS });
    }
    ,
    resolveClass: function (path)
    {
        return nit.resolvePath (path, { paths: nit.CLASS_PATHS });
    }
    ,
    fileEncodingForContent: function (content, encoding)
    {
        return encoding === undefined && nit.is.str (content) ? "utf8" : encoding;
    }
    ,
    listPackageDirs: function (root)
    {
        return nit.array (nit.PACKAGE_SUBDIRS
            .map (pkgDir => nit.path.join (root, pkgDir))
            .filter (d => nit.isDir (d))
            .map (d => nit.fs.readdirSync (d, { withFileTypes: true })) , true)
                .filter (d => d.isDirectory () && (d.path = nit.path.join (d.path, d.name)))
        ;
    }
    ,
    readFile: function (path, optional, encoding)
    {
        ({ path, optional = false, encoding = "utf8" } = nit.typedArgsToObj (arguments,
        {
            path: "string",
            optional: "boolean",
            encoding: "string"
        }));

        let file = path;

        if (!(file = nit.resolveAsset (file)))
        {
            if (optional)
            {
                return;
            }

            nit.throw ("error.file_not_found", { path });
        }

        return nit.fs.readFileSync (file, encoding);
    }
    ,
    readFileAsync: async function (path, optional, encoding)
    {
        ({ path, optional = false, encoding = "utf8" } = nit.typedArgsToObj (arguments,
        {
            path: "string",
            optional: "boolean",
            encoding: "string"
        }));

        let file = path;

        if (!(file = nit.resolveAsset (file)))
        {
            if (optional)
            {
                return;
            }

            nit.throw ("error.file_not_found", { path });
        }

        return await nit.fs.promises.readFile (file, encoding);
    }
    ,
    readStream: function (stream, encoding)
    {
        encoding = arguments.length == 1 ? "utf8" : encoding;

        return new Promise (function (res, rej)
        {
            let buffers = [];

            stream
                .on ("data", function (data)
                {
                    buffers.push (Buffer.from (data));
                })
                .on ("end", function ()
                {
                    let buf = Buffer.concat (buffers);

                    res (nit.is.undef (encoding) ? buf : buf.toString (encoding));
                })
                .on ("error", function (error)
                {
                    rej (error);
                })
            ;
        });
    }
    ,
    resetRequireCache: function ()
    {
        REQUIRE_CACHE = {};
    }
    ,
    require: function (path, optional)
    {
        let isClass;
        let file;
        let obj;

        if (path)
        {
            let p = path;

            isClass = !!path.match (nit.CLASS_NAME_PATTERN);

            do
            {
                file = nit.resolveClass (nit.classNameToPath (p));

                if (!file)
                {
                    p = isClass ? nit.kvSplit (p, ".", true)[0] : "";
                }
            }
            while (!file && p);
        }

        if (!file)
        {
            if (optional)
            {
                return;
            }

            nit.throw ("error.file_not_found", { path });
        }

        if (isClass)
        {
            // init the top-level NS first
            nit.ns.init (nit.kvSplit (path, ".")[0]);
        }

        function returnResult (obj)
        {
            return isClass ? nit.CLASSES[path] : obj;
        }

        if (file in REQUIRE_CACHE)
        {
            return returnResult (REQUIRE_CACHE[file]);
        }

        obj = require (file);

        if (nit.is.func (obj))
        {
            let resolve;

            REQUIRE_CACHE[file] = new Promise ((res) =>
            {
                resolve = res;
            });

            REQUIRE_CACHE[file] = obj = nit.ns.invoke (obj);

            if (obj instanceof Promise)
            {
                obj.then (function (obj)
                {
                    REQUIRE_CACHE[file] = obj;

                    resolve (returnResult (obj));
                });
            }
            else
            {
                resolve (returnResult (obj));
            }
        }
        else
        {
            REQUIRE_CACHE[file] = obj;
        }

        return returnResult (obj);
    }
    ,
    requireAll: function ()
    {
        let results = nit.array (arguments).map (nit.require);

        for (let r of results)
        {
            if (r instanceof Promise)
            {
                return Promise.all (results);
            }
        }

        return results;
    }
    ,
    requireAsset: function (path, optional)
    {
        return nit.require (nit.resolveAsset (path), optional);
    }
    ,
    requireModule: function (path, optional) // used to include node modules
    {
        try
        {
            return require.main.require (path);
        }
        catch (e)
        {
            try
            {
                return require (nit.resolveAsset (path) || path);
            }
            catch (ex)
            {
                if (ex.code == "MODULE_NOT_FOUND")
                {
                    if (optional)
                    {
                        return;
                    }

                    nit.throw ("error.module_not_found", { path });
                }
                else
                {
                    ex.message += ` (Module: ${path})`;

                    throw ex;
                }
            }
        }
    }
    ,
    lookupClass: nit.do (nit.lookupClass, function (oldLookupClass)
    {
        return function (name)
        {
            return oldLookupClass (name) || nit.require (name, true);
        };
    })
    ,
    loadExtensions: function ()
    {
        nit.ASSET_PATHS.forEach ((p) =>
        {
            var dir = nit.path.join (p, "exts");

            if (nit.isDir (dir))
            {
                nit.fs.readdirSync (dir).forEach ((ext) =>
                {
                    nit.require (nit.path.join (dir, ext));
                });
            }
        });
    }
    ,
    initPackages: function ()
    {
        nit.ASSET_PATHS.forEach ((p) =>
        {
            nit.require (nit.path.join (p, "init.js"), true);
        });
    }
    ,
    loadConfig: function (path, optional)
    {
        var config = nit.requireModule (path, optional);

        return config && JSON.parse (JSON.stringify (config)); // Use JSON.stringify () so that it'll not modify the object if the config is a js file.
    }
    ,
    loadConfigs: function ()
    {
        var entries = [];
        var sections = {};

        function scanDirs (dirs, file)
        {
            dirs.forEach (function (d)
            {
                var cfg = nit.loadConfig (nit.path.join (d, file), true);

                nit.each (cfg, function (v, k)
                {
                    if (k[0] == "@")
                    {
                        sections[k] = v;
                    }
                    else
                    {
                        entries.push ({ k, v });
                    }
                });
            });
        }

        scanDirs (nit.ASSET_PATHS, "nit.json");
        scanDirs (nit.PROJECT_PATHS, "nit.local.json");

        nit.each (nit.keys (sections).sort (), function (k)
        {
            var v = sections[k];

            if (!nit.is.obj (v))
            {
                nit.throw ("error.invalid_config_section", { section: k, value: v });
            }

            nit.each (v, function (vv, kk)
            {
                entries.push ({ k: kk, v: vv });
            });
        });

        var queue = nit.Queue ();

        nit.each (entries, function (e)
        {
            queue.push (function ()
            {
                return nit.config (e.k, e.v);
            });
        });

        return queue.run ();
    }
    ,
    runCompgen: async function ()
    {
        let compgen = await nit.Compgen ();

        await compgen.run ();
    }
    ,
    listComponentPaths: function (category)
    {
        let cats = nit.path.join (nit.path.sep, ...category.split ("."));
        let paths = [];
        let dirs = nit.CLASS_PATHS.map ((d) => ({ root: d, path: d }));

        while (dirs.length)
        {
            let dir = dirs.shift ();
            let subdirs = nit.fs.readdirSync (dir.path, { withFileTypes: true })
                .filter (d => d.isDirectory ())
                .map (d => nit.path.join (d.path, d.name))
            ;

            for (let p of subdirs)
            {
                if (p.endsWith (cats))
                {
                    let relPath = p.slice (dir.root.length + 1);
                    let ns = nit.kababCase (relPath.split (nit.path.sep).shift ());

                    paths.push (
                    {
                        path: p,
                        classNamespace: relPath.replaceAll (nit.path.sep, "."),
                        namespace: ns == category ? "" : ns
                    });
                }
                else
                {
                    dirs.push (
                    {
                        root: dir.root,
                        path: p
                    });
                }
            }
        }

        return paths;
    }
    ,
    listComponents: nit.do (nit.listComponents, function (pListComponents)
    {
        return function (category, returnNames)
        {
            let components = pListComponents (category);

            for (let p of nit.listComponentPaths (category))
            {
                for (let c of nit.fs.readdirSync (p.path))
                {
                    let className = p.classNamespace + "." + nit.path.parse (c).name;
                    let cd = nit.getComponentDescriptor (className)
                        || new nit.ComponentDescriptor (className, category, { path: nit.path.join (p.path, c) });

                    nit.arrayRemove (components, (c) => c.name == cd.name);
                    components.push (cd);
                }
            }

            return returnNames ? components.map (c => c.name) : components;
        };
    })
    ,
    listCommands: function (returnNames)
    {
        return nit.listComponents ("commands", returnNames);
    }
    ,
    lookupCommand: function (name, optional)
    {
        let command = nit.listCommands ().find (d => d.name == name || d.className == name)?.class;

        if (!command)
        {
            if (!optional)
            {
                nit.throw ("error.command_not_found", { command: name });
            }
        }
        else
        if (!nit.is.subclassOf (command, nit.Command))
        {
            nit.throw ("error.invalid_command", { command: name });
        }

        return command;
    }
    ,
    runCommand: async function ()
    {
        let [name = "console", ...args] = nit.ARGV;
        let cls = nit.lookupCommand (name);
        let result = await cls ().run (...args);

        if (!nit.is.empty (result))
        {
            nit.inspect (result);
        }

        return result;
    }

}, true);


(function (shutdown)
{
    nit.UNEXPECTED_ERROR_EVENTS.forEach (event => process.on (event, nit.handleException));
    nit.SHUTDOWN_EVENTS.forEach (event => process.on (event, shutdown));

} (function shutdown ()
{
    SHUTDOWN = true;

    nit.SHUTDOWN_EVENTS.forEach (event => process.removeListener (event, shutdown));

    return nit.shutdown ();
}));


module.exports = (function ()
{
    nit.trim (nit.ENV.NIT_DEBUG).split (":").forEach (p =>
    {
        nit.debug (p);
    });

    let result = nit
        .preInit (nit.initPackages)
        .preInit (nit.loadConfigs)
        .postInit (nit.loadExtensions)
        .postInit (function ()
        {
            nit.requireAll ("nit.Dir", "nit.File");

            if (nit.CLI_MODE)
            {
                if (nit.COMPLETION_MODE)
                {
                    nit.require ("nit.Compgen");
                    nit.ready (nit.runCompgen);
                }
                else
                {
                    nit.require ("nit.Command");
                    nit.ready (nit.runCommand);
                }
            }
        })
        .init ()
    ;

    if (result != nit) // async
    {
        result.nit = nit;
    }

    return result;
}) ();

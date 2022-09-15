const nit = require ("../public/nit");

const REQUIRE_CACHE = {};
const READY_QUEUE = nit.Queue ();
const INIT_QUEUE = nit.Queue ();

let ready = false;

// supported env vars
//    - NIT_CLASS_SUBDIRS string "A comma, space or colon separated list of subdirs that contains the class or JS files."
//    - NIT_DEBUG boolean "Whether to enable the debug mode."
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
    .registerTypeParser (new nit.Object.PrimitiveTypeParser ("file", "", function (v) { return nit.Object.PrimitiveTypeParser.valueToString (v); }))
    .registerTypeParser (new nit.Object.PrimitiveTypeParser ("dir", "", function (v) { return nit.Object.PrimitiveTypeParser.valueToString (v); }))

    .staticMethod ("use", function (name)
    {
        let args = nit.array (arguments).slice (1);
        let [n, p] = nit.array (name);

        if (n.includes (":"))
        {
            p = p || nit.pascalCase (n.split (":").pop ());

            this.staticMemo (p, () => nit.lookupComponent (n, ...args));
        }
        else
        if (n.match (nit.CLASS_NAME_PATTERN))
        {
            p = p || n.split (".").pop ();

            this.staticMemo (p, () => nit.lookupClass (n));
        }
        else
        {
            p = p || n;

            this.staticMemo (p, () => nit.require (n, true) || nit.requireModule (n));
        }

        return this;
    })
;




nit.dpgs (nit,
{
    CWD: process.cwd (),
    ENV: process.env,
    ARGV: process.argv.slice (2),
    DEFAULT_PACKAGE_SUBDIRS: "packages",
    DEFAULT_CLASS_SUBDIRS: "public lib",
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
    READY: function ()
    {
        return ready;
    }
    ,
    DEBUG: nit.memoize (function ()
    {
        return nit.is.truthy (nit.ENV.NIT_DEBUG);
    })
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
        let paths = [nit.path.join (nit.USER_HOME, ".nit")];

        if (nit.ENV.NIT_PROJECT_PATHS)
        {
            paths.push (...nit.ENV.NIT_PROJECT_PATHS.split (":"));
        }

        paths.push (nit.resolvePackageRoot (), nit.HOME);

        if (nit.HOME.includes ("node_modules"))
        {
            let dir = nit.path.dirname (nit.HOME);

            for (let f of nit.fs.readdirSync (dir, { withFileTypes: true }))
            {
                f = nit.path.join (dir, f.name);

                if (nit.isDir (f) && f != nit.HOME)
                {
                    paths.push (f);
                }
            }
        }

        return nit.arrayUnique (paths)
            .filter (p => nit.isDir (p))
        ;
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
                    for (let f of nit.fs.readdirSync (g, { withFileTypes: true }))
                    {
                        f = nit.path.join (g, f.name);

                        if (nit.isDir (f))
                        {
                            paths.push (f);
                        }
                    }
                }
            }
        }

        return paths;
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
    fs: require ("fs"),
    path: require ("path"),
    util: require ("util"),
    os: require ("os")

}, true);


nit.dpvs (nit,
{
    beep: function (times)
    {
        process.stderr.write ("\x07".repeat (times || 1));
    }
    ,
    throw: nit.do (nit.throw, function (oldThrow)
    {
        return function (code) // eslint-disable-line no-unused-vars
        {
            let ignored;

            try
            {
                oldThrow.apply (this, ["error"]);
            }
            catch (e)
            {
                ignored = e.stack.split ("\n").slice (1, 3);
                ignored[1] = ignored[1].replace (/\d+:\d+\)$/, function (m)
                {
                    let [line, char] = nit.kvSplit (m, ":");

                    return (line * 1 + 15) + ":" + char; // 15 is the line diff between the two oldThrow.apply () calls.
                });
            }

            try
            {
                oldThrow.apply (this, arguments);
            }
            catch (e)
            {
                e.stack = nit.arrayUnique (
                        e.stack
                            .split ("\n")
                            .filter (l => !l.match (/^\s+at/) || !ignored.includes (l))
                    )
                    .join ("\n")
                    .replace (/^Error:\s*/i, "")
                ;

                throw e;
            }
        };
    })
    ,
    handleException: function (err)
    {
        process.exitCode = 1;

        nit.log ("[ERROR]", nit.DEBUG ? err.stack : err.message);
    }
    ,
    dbg: function ()
    {
        if (nit.DEBUG)
        {
            nit.log ("[DEBUG]", ...arguments);
        }
    }
    ,
    argsToInspectData: function ()
    {
        return nit.array (arguments).map ((v) => (nit.is.str (v) ? v : nit.util.inspect (nit.clone (v), nit.INSPECT_DEFAULTS)));
    }
    ,
    inspect: function ()
    {
        console.log (...nit.argsToInspectData (...arguments));
    }
    ,
    isDir: function (path)
    {
        let stats;

        if ((stats = path && nit.fs.existsSync (path) && nit.fs.statSync (path)))
        {
            return stats.isDirectory ();
        }

        return false;
    }
    ,
    resolvePackageRoot: function (file)
    {
        if (!file)
        {
            return nit.fs.realpathSync (nit.CWD);
        }

        var path = nit.isDir (file) ? file : nit.path.dirname (file);
        var last;

        while (path != last)
        {
            last = path;

            if (nit.fs.existsSync (nit.path.join (path, "package.json")))
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
        try
        {
            return nit.fs.realpathSync (require.resolve (path, options));
        }
        catch (e)
        {
            var parsed = nit.path.parse (path);

            if (!path.startsWith ("./") && (!parsed.root || !parsed.dir))
            {
                return nit.resolvePath ("./" + path, options);
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
    require: function (path, optional)
    {
        let file = nit.classNameToPath (path);

        if (!(file = nit.resolveClass (file)))
        {
            if (optional)
            {
                return;
            }

            nit.throw ("error.file_not_found", { path });
        }

        if (file in REQUIRE_CACHE)
        {
            return REQUIRE_CACHE[file];
        }

        let obj = require (file);

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
                    resolve (REQUIRE_CACHE[file] = obj);
                });
            }
            else
            {
                resolve (obj);
            }
        }
        else
        {
            REQUIRE_CACHE[file] = obj;
        }

        return obj;
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
    ready: function ()
    {
        nit.array (arguments)
            .forEach (function (task)
            {
                READY_QUEUE.push (() => nit.ns.invoke (task));
            })
        ;

        if (ready)
        {
            return READY_QUEUE.run (() => nit);
        }

        return nit;
    }
    ,
    preInit: function (task)
    {
        INIT_QUEUE.lpush (() => nit.ns.invoke (task));

        return nit;
    }
    ,
    postInit: function (task)
    {
        INIT_QUEUE.push (() => nit.ns.invoke (task));

        return nit;
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
        let paths = [];
        let dirs = nit.CLASS_PATHS.map ((d) => ({ root: d, path: d }));

        while (dirs.length)
        {
            let dir = dirs.shift ();

            for (let f of nit.fs.readdirSync (dir.path, { withFileTypes: true }))
            {
                let p = nit.path.join (dir.path, f.name);

                if (nit.isDir (p))
                {
                    if (f.name == category)
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
                    let className = nit.path.parse (c).name;
                    let name = nit.kababCase (className);
                    let cd = new nit.ComponentDescriptor (
                    {
                        name: (p.namespace ? (p.namespace + ":") : "") + name,
                        className: p.classNamespace + "." + className,
                        namespace: p.namespace,
                        path: nit.path.join (p.path, c)
                    });

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
    lookupCommand: function (name)
    {
        try
        {
            return nit.lookupComponent (name, "commands", "nit.Command");
        }
        catch (e)
        {
            if (e.code == "error.component_not_found")
            {
                nit.throw ("error.command_not_found", { command: name });
            }
            else
            if (e.code == "error.invalid_component")
            {
                nit.throw ("error.invalid_command", { command: name });
            }
            else
            {
                throw e;
            }
        }
    }
    ,
    runCommand: async function ()
    {
        let [name = "console", ...args] = nit.ARGV;
        let cls = nit.lookupCommand (name);
        let result = await cls.run (args);

        if (!nit.is.empty (result))
        {
            nit.inspect (result);
        }

        return result;
    }

}, true);


nit.each (["unhandledRejection", "uncaughtException"], function (event)
{
    process
        .removeAllListeners (event)
        .on (event, nit.handleException)
    ;
});


module.exports = (function ()
{
    let result = INIT_QUEUE
        .push (function ()
        {
            if (nit.CLI_MODE)
            {
                if (nit.COMPLETION_MODE)
                {
                    nit.require ("nit.Compgen")
                        .require ("nit.compgen.completers.File")
                        .require ("nit.compgen.completers.Dir")
                        .require ("nit.compgen.completers.Choice")
                    ;

                    nit.ready (nit.runCompgen);
                }
                else
                {
                    nit.require ("nit.Command");
                    nit.ready (nit.runCommand);
                }
            }
        })
        .push (nit.initPackages)
        .push (nit.loadExtensions)
        .push (nit.loadConfigs)
        .run (function ()
        {
            ready = true;

            return nit.ready ();
        })
    ;

    if (result != nit) // async
    {
        result.nit = nit;
    }

    return result;
}) ();

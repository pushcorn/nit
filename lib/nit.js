const nit = require ("../public/nit");

const REQUIRE_CACHE = {};
const READY_QUEUE = nit.Queue ();
const INIT_QUEUE = nit.Queue ();

let ready = false;

// supported env vars
//    - NIT_CLASS_SUBDIRS string "A comma, space or colon separated list of subdirs that contains the class or JS files."
//    - NIT_COMMANDS_SUBDIR string "The subdir name for CLI commands."
//    - NIT_DEBUG boolean "Whether to enable the debug mode."
//    - NIT_PACKAGE_SUBDIRS string "A comma, space or colon separated list of project subdirs that contains the packages."
//    - NIT_PROJECT_PATHS string "A colon separated list of project paths."

nit.dpgs (nit,
{
    CWD: process.cwd (),
    ENV: process.env,
    ARGV: process.argv.slice (2),
    DEFAULT_PACKAGE_SUBDIRS: "packages",
    DEFAULT_CLASS_SUBDIRS: "public lib",
    DEFAULT_COMMANDS_SUBDIR: "commands",
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
    NIT_HOME: nit.memoize (function ()
    {
        return nit.path.dirname (__dirname);
    })
    ,
    CLI_MODE: nit.memoize (function ()
    {
        return process.argv[1] == nit.NIT_HOME;
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

        paths.push (nit.resolvePackageRoot (), nit.NIT_HOME);

        if (nit.NIT_HOME.includes ("node_modules"))
        {
            let dir = nit.path.dirname (nit.NIT_HOME);

            for (let f of nit.fs.readdirSync (dir, { withFileTypes: true }))
            {
                f = nit.path.join (dir, f.name);

                if (nit.isDir (f) && f != nit.NIT_HOME)
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
        sorted:   false
    }
    ,
    fs: require ("fs"),
    path: require ("path"),
    util: require ("util"),
    os: require ("os")

}, true);


nit
    .m ("error.file_not_found", "The file '%{path}' does not exist.")
    .m ("error.module_not_found", "The module '%{path}' was not found.")
    .m ("error.invalid_config_section", "The section '%{section}' is not an object. (Given: %{value|nit.serialize})")
    .m ("error.command_required", "Please specify a command.")
    .m ("error.command_not_found", "The command '%{command}' was not found.")
    .m ("error.invalid_command", "The command '%{command}' is not an instance of nit.Command.")
;

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
            try
            {
                oldThrow.apply (this, arguments);
            }
            catch (e)
            {
                e.stack = e.stack
                    .split ("\n")
                    .filter ((l, i) => !i || i > 2)
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

        return ((ns ? (ns + ".") : "") + nit.pascalCase (sn)).replace (/\./g, nit.path.sep) + ".js";
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
    readFile: function (path, optional)
    {
        var file = path;

        if (!(file = nit.resolveAsset (file)))
        {
            if (optional)
            {
                return;
            }

            nit.throw ("error.file_not_found", { path });
        }

        return nit.fs.readFileSync (file, "utf-8");
    }
    ,
    readFileAsync: async function (path, optional)
    {
        var file = path;

        if (!(file = nit.resolveAsset (file)))
        {
            if (optional)
            {
                return;
            }

            nit.throw ("error.file_not_found", { path });
        }

        return await nit.fs.promises.readFile (file, "utf-8");
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
                if (!optional)
                {
                    nit.throw ("error.module_not_found", { path });
                }
            }
        }
    }
    ,
    lookupClass: nit.do (nit.lookupClass, function (oldLookupClass)
    {
        return function (name)
        {
            let cls = oldLookupClass (name);

            if (!cls)
            {
                nit.require (name, true);
                cls = oldLookupClass (name);
            }

            return cls;
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
    listComponentPaths: function (subdir)
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
                    if (f.name == subdir)
                    {
                        paths.push (
                        {
                            path: p,
                            classNamespace: p.slice (dir.root.length + 1).replaceAll (nit.path.sep, "."),
                            namespace: p.slice (dir.root.length + 1)
                                .split (nit.path.sep)
                                .slice (0, -1)
                                .map (nit.kababCase)
                                .join (":")
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
    listComponents: function (subdir)
    {
        let components = [];

        for (let p of nit.listComponentPaths (subdir))
        {
            for (let c of nit.fs.readdirSync (p.path))
            {
                let className = nit.path.parse (c).name;
                let name = nit.kababCase (className);

                components.push (
                {
                    path: nit.path.join (p.path, c),
                    name,
                    className: p.classNamespace + "." + className,
                    namespace: p.namespace,
                    cn: (p.namespace ? (p.namespace + ":") : "") + name // component name
                });
            }
        }

        return components;
    }
    ,
    listCommands: function ()
    {
        return nit.listComponents (nit.ENV.NIT_COMMANDS_SUBDIR || nit.DEFAULT_COMMANDS_SUBDIR);
    }
    ,
    runCommand: async function ()
    {
        let [cn, ...args] = nit.ARGV;

        if (!cn)
        {
            nit.throw ("error.command_required");
        }

        let command = nit.find (nit.listCommands (), "cn", cn);

        if (!command)
        {
            nit.throw ("error.command_not_found", { command: cn });
        }

        let cls = await nit.require (command.path);

        if (!nit.is.subclassOf (cls, nit.Command))
        {
            nit.throw ("error.invalid_command", { command: cn });
        }

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

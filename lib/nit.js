const nit = require ("../public/js/nit");

const REQUIRE_CACHE = {};
const READY_QUEUE = nit.Queue ();
const INIT_QUEUE = nit.Queue ();

let ready = false;

// supported env vars
//    - NIT_CLASS_SUBDIRS string "A comma, space or colon separated list of subdirs that contains the class or JS files."
//    - NIT_DEBUG boolean "Whether to enable the debug mode."
//    - NIT_PACKAGE_SUBDIRS string "A comma, space or colon separated list of project subdirs that contains the packages."
//    - NIT_PROJECT_PATHS string "A colon separated list of project paths."

nit.dpgs (nit,
{
    CWD: process.cwd (),
    ENV: process.env,
    ARGV: process.argv.slice (2),
    DEFAULT_PACKAGE_SUBDIRS: "packages",
    DEFAULT_CLASS_SUBDIRS: "public/js lib",
    HOME: nit.memoize (function ()
    {
        return nit.path.dirname (__dirname);
    })
    ,
    READY: function ()
    {
        return ready;
    }
    ,
    DEBUG: nit.memoize (function ()
    {
        return nit.ENV.NIT_DEBUG == "true";
    })
    ,
    NIT_ROOT: nit.memoize (function ()
    {
        return nit.path.dirname (__dirname);
    })
    ,
    PROJECT_PATHS: nit.memoize (function ()
    {
        return nit.arrayUnique ([nit.NIT_ROOT, nit.resolvePackageRoot ()].concat (nit.ENV.NIT_PROJECT_PATHS && nit.ENV.NIT_PROJECT_PATHS.split (":") || []));
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
    PACKAGE_PATHS: nit.memoize (function ()
    {
        let packageDirs = [];

        for (let p of nit.PROJECT_PATHS)
        {
            packageDirs.push (p);

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
                            packageDirs.push (f);
                        }
                    }
                }
            }
        }

        return packageDirs;
    })
    ,
    SEARCH_PATHS: nit.memoize (function ()
    {
        let searchPaths = nit.PROJECT_PATHS.slice ();

        for (let p of nit.PACKAGE_PATHS)
        {
            for (let c of nit.CLASS_SUBDIRS)
            {
                c = nit.path.join (p, c);

                if (nit.fs.existsSync (c))
                {
                    searchPaths.push (c);
                }
            }
        }

        return searchPaths;
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
    util: require ("util")
});

nit
    .m ("error.file_not_found", "The file '%{path}' does not exist.")
    .m ("error.invalid_class", "The class '%{name}' is invalid.")
    .m ("error.invalid_config_section", "The section '%{section}' is not an object. (Given: %{value|nit.serialize})")
;

nit.dpvs (nit,
{
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
                    .filter ((l, i) => !i || !l.includes (nit.NIT_ROOT))
                    .join ("\n")
                ;

                throw e;
            }
        };
    })
    ,
    dbg: function ()
    {
        if (nit.DEBUG)
        {
            nit.log ("[DEBUG]", ...arguments);
        }
    }
    ,
    inspect: function ()
    {
        console.log (...nit.array (arguments).map ((v) => (nit.is.str (v) ? v : nit.util.inspect (nit.clone (v), nit.INSPECT_DEFAULTS))));
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
    resolveAsset: function (path)
    {
        return nit.resolvePath (path, { paths: nit.PACKAGE_PATHS });
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
            return nit.fs.realpathSync (require.resolve (path, options || { paths: nit.SEARCH_PATHS }));
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
    readFile: function (path, optional)
    {
        var file = path;

        if (!(file = nit.resolvePath (file)))
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

        if (!(file = nit.resolvePath (file)))
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

        if (!(file = nit.resolvePath (file)))
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
    requireModule: function (path) // used to include node modules
    {
        try
        {
            return require.main.require (path);
        }
        catch (e)
        {
            return require (path);
        }
    }
    ,
    lookupClass: nit.do (nit.lookupClass, function (oldLookupClass)
    {
        return function (name)
        {
            let cls = oldLookupClass (name);

            if (!cls
                && (cls = nit.require (name, true))
                && !nit.is.func (cls))
            {
                nit.throw ("error.invalid_class", { name });
            }

            return cls;
        };
    })
    ,
    loadExtensions: function ()
    {
        nit.PACKAGE_PATHS.forEach ((p) =>
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
        nit.PACKAGE_PATHS.forEach ((p) =>
        {
            nit.require (nit.path.join (p, "init.js"), true);
        });
    }
    ,
    loadConfig: function (path, optional)
    {
        var config = nit.require (path, optional);

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

        scanDirs (nit.PACKAGE_PATHS, "nit.json");
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
});


module.exports = (function ()
{
    let result = INIT_QUEUE
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

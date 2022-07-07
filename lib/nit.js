const nit = require ("../public/js/nit");

let ready = false;
let readyQueue = [];
let requiredFiles = {};

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
    INIT_QUEUE: nit.Queue (),
    DEFAULT_PACKAGE_SUBDIRS: "packages",
    DEFAULT_CLASS_SUBDIRS: "public/js lib",
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
    PROJECT_PATHS: nit.memoize (function ()
    {
        return nit.arrayUnique ([nit.path.dirname (__dirname), nit.resolvePackageRoot ()].concat (nit.ENV.NIT_PROJECT_PATHS && nit.ENV.NIT_PROJECT_PATHS.split (":") || []));
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


nit.dpvs (nit,
{
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
            if (stats.isDirectory ())
            {
                return true;
            }

            if (stats.isSymbolicLink ())
            {
                return nit.isDir (nit.fs.realpathSync (path));
            }
        }

        return false;
    }
    ,
    resolvePackageRoot: function (file)
    {
        var path = nit.isDir (file) ? file : (file ? nit.path.dirname (file) : nit.CWD);
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

        return nit.fs.realpathSync (nit.CWD);
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

            nit.throw ("The file '%{path}' does not exist.", { path });
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

            nit.throw ("The file '%{path}' does not exist.", { path });
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

            nit.throw ("The file '%{path}' does not exist.", { path });
        }

        if (requiredFiles[file])
        {
            return requiredFiles[file];
        }

        var obj = require (file);
        var resolve, reject;

        if (nit.is.func (obj))
        {
            requiredFiles[file] = new Promise ((res, rej) =>
            {
                resolve = res;
                reject = rej;
            });

            try
            {
                requiredFiles[file] = obj = nit.importClass (obj);
                resolve (obj);
            }
            catch (e)
            {
                reject (e);
            }
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
    lookupClass: (function (oldLookupClass)
    {
        function lookupClass (name)
        {
            let cls = oldLookupClass (name);

            if (!cls
                && (cls = nit.require (name, true))
                && !nit.is.func (cls))
            {
                nit.throw ("The class '%{name}' is invalid.", { name });
            }

            return cls;
        }

        return lookupClass;

    }) (nit.lookupClass)
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
                nit.throw ("The section '%{k}' is not an object. (Given: %{v|nit.serialize})", { k, v });
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
        if (arguments.length)
        {
            readyQueue.push (...arguments);
        }

        if (ready)
        {
            let task;

            while ((task = readyQueue.shift ()))
            {
                task (nit);
            }
        }

        return nit;
    }
    ,
    init: function ()
    {
        return nit.INIT_QUEUE
            .push (nit.initPackages)
            .push (nit.loadExtensions)
            .push (nit.loadConfigs)
            .run (function ()
            {
                ready = true;

                return nit.ready ();
            })
        ;
    }
});

module.exports = nit.init ();

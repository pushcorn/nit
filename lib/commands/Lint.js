module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Lint"))
        .describe ("Perform code linting using ESlint.")
        .use ("nit.utils.Colorizer")
        .defineInput (Input =>
        {
            Input
                .option ("all", "boolean", "Include the projects inside the packages directory.")
                .option ("cwd", "dir", "The working directory.")
                .option ("packages...", "string", "The packages to include.")
                    .constraint ("choice", ...nit.listPackageDirs (process.cwd ()).map (d => d.name))
                .option ("errorOnUnmatchedPattern", "boolean", "Whether to throw an error when no target files are found.")
                .option ("patterns...", "string", "The patterns of the files to be linted.",
                [
                    "public/**/*.js",
                    "lib/**/*.js",
                    "exts/**/*.js",
                    "test/**/*.js"
                ])
                .option ("fallbackConfigFile", "nit.File", "The fallback config file to use.", nit.path.join (nit.HOME, "resources/eslint/eslintrc.json"))
            ;
        })
        .onRun (async function (ctx)
        {
            let { patterns, cwd, all, packages, errorOnUnmatchedPattern, fallbackConfigFile } = ctx.input;

            let esLint = nit.new ("nit.lint.EsLint");
            let pwd = process.cwd ();
            let root = cwd || esLint.options.cwd || pwd;

            if (!nit.path.isAbsolute (root))
            {
                root = nit.path.join (pwd, root);
            }

            let results = [];
            let dirs = all || !packages.length ? [root] : [];
            let packageDirs = nit.listPackageDirs (root)
                .filter (d => d.isDirectory () && ((all && !packages.length) || packages.includes (d.name)))
                .map (d => d.path);

            dirs.push (...packageDirs);

            for (let dir of dirs)
            {
                process.chdir (dir);

                let rc = nit.lint.EsLint.findRc (dir);

                if (!rc && !esLint.options.overrideConfigFile)
                {
                    esLint.options.overrideConfigFile = fallbackConfigFile.absPath;
                }

                esLint.options.cwd = dir;
                esLint.options.errorOnUnmatchedPattern = errorOnUnmatchedPattern;

                let result = await esLint.lint (patterns);
                let { bold, inverse } = Self.Colorizer;

                if (result)
                {
                    let header = dirs.length == 1 ? "" : ("\n" + inverse (bold (" " + (dir.slice (root.length + 1) || nit.path.basename (dir)) + " ")) + "\n");

                    results.push (header + result);
                }

                ctx.exitCode = ctx.exitCode || esLint.errorCount;
            }

            return results.join ("\n");
        })
    ;
};

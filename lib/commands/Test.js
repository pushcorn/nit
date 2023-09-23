module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Test"))
        .describe ("Perform tests with jest.")
        .use ("nit.utils.Colorizer")
        .defineInput (Input =>
        {
            Input
                .option ("[testPathPattern...]", "file", "A regexp pattern string that is matched against all tests paths before executing the test.")
                .option ("watch", "boolean", "Watch files for changes and rerun tests related to changed files.")
                .option ("all", "boolean", "Include the projects inside the packages directory.")
                .option ("packages...", "string", "The packages to include.")
                    .constraint ("choice", ...nit.array (nit.PACKAGE_SUBDIRS.map (pkgDir => nit.fs.readdirSync (nit.path.join (process.cwd (), pkgDir), { withFileTypes: true })), true)
                        .filter (d => d.isDirectory ())
                        .map (d => d.name))
                .option ("testEnvironment", "string", "The test environment that will be used for testing.", "node")
                    .constraint ("choice", "node", "jsdom")

                .option ("dir", "dir", "The working directory.")
                .option ("setupFilesAfterEnv...", "file", "The files that will be added to Jest's setupFilesAfterEnv.", [nit.path.join (nit.HOME, "resources/jest/setup.js")])
                .option ("testMatch...", "string", "The glob patterns Jest uses to detect test files.", ["<rootDir>/test/tests/**/*.js"])
                .option ("noCollectCoverage", "boolean", "Indicates whether the coverage information should be collected while executing the test.")
                .option ("noVerbose", "boolean", "Indicates whether each individual test should be reported during the run.")
                .option ("detectOpenHandles", "boolean", "Attempt to collect and print open handles preventing Jest from exiting cleanly.")
                .option ("forceExit", "boolean", "Force Jest to exit after all tests have completed running.")
                .option ("runInBand", "boolean", "Run all tests serially in the current process, rather than creating a worker pool of child processes that run tests.")
                .option ("maxWorkers", "string", "Specifies the maximum number of workers the worker-pool will spawn for running tests.", "75%")
                .option ("timeout", "integer", "The test timeout.", 30000)
                .option ("coverageReporters...", "string", "A list of reporter names that Jest uses when writing coverage reports.", ["clover", "json", "lcov", "text"])
                    .constraint ("choice", "none", "clover", "cobertura", "html-spa", "html", "json-summary", "json", "lcov", "lcovonly", "none", "teamcity", "text-lcov", "text-summary", "text")
            ;
        })
        .onRun (async function (ctx)
        {
            let jest = nit.new ("nit.test.Jest");
            let
            {
                dir,
                all,
                packages,
                noCollectCoverage,
                noVerbose,
                setupFilesAfterEnv,
                testMatch,
                testPathPattern,
                testEnvironment,
                watch,
                timeout,
                detectOpenHandles,
                forceExit,
                runInBand,
                maxWorkers,
                coverageReporters

            } = ctx.input;

            nit.assign (jest.config,
            {
                collectCoverage: !noCollectCoverage,
                verbose: !noVerbose,
                setupFilesAfterEnv,
                testMatch,
                testTimeout: timeout,
                coverageReporters
            });

            nit.assign (jest,
            {
                testPathPattern,
                testEnvironment,
                watch,
                detectOpenHandles,
                forceExit,
                runInBand,
                maxWorkers
            });

            // all  packages  dirs
            // ---  --------  ----
            // x    -         root and all packages
            // x    x         root and selected packages
            // -    x         selected packages
            // -    -         root

            let uncoveredLines = 0;
            let root = dir || process.cwd ();
            let dirs = all || !packages.length ? [root] : [];
            let defaultSetupFilesAfterEnv = setupFilesAfterEnv.slice ();
            let packageDirs = nit.array (nit.PACKAGE_SUBDIRS.map (pkgDir => nit.fs.readdirSync (nit.path.join (root, pkgDir), { withFileTypes: true })), true)
                .filter (d => d.isDirectory () && ((all && !packages.length) || packages.includes (d.name)))
                .map (d => nit.path.join (d.path, d.name));

            dirs.push (...packageDirs);

            for (let dir of dirs)
            {
                process.chdir (dir);

                let setupFile;

                jest.config.setupFilesAfterEnv = defaultSetupFilesAfterEnv.slice ();

                for (let p of nit.ASSET_PATHS.slice ().sort ((a, b) => b.length - a.length))
                {
                    if (dir.startsWith (p))
                    {
                        ["setup.js", "setup.local.js"].forEach (s =>
                        {
                            if (nit.fs.existsSync (setupFile = nit.path.join (p, "test", s)))
                            {
                                jest.config.setupFilesAfterEnv.push (setupFile);
                            }
                        });
                    }
                }

                let { results } = await jest.run (dir);

                nit.each (results.coverageMap?.data, coverage =>
                {
                    nit.each (coverage.getLineCoverage (), v => (v || ++uncoveredLines));
                });

                if (!results.success)
                {
                    process.exitCode = 1;

                    break;
                }
            }

            let { bold, yellow, red, green } = Self.Colorizer;
            let color = !uncoveredLines ? green : (uncoveredLines > 20 ? red : yellow);

            nit.log (bold (`\nTotal Uncovered Lines: ${color (uncoveredLines)}\n`));
        })
    ;
};

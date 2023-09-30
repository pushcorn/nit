module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.test.Jest"))
        .use ("nit.utils.Colorizer")
        .field ("config", "object", "The jest configuration.")
        .field ("testPathPattern...", "string", "A regexp pattern string that is matched against all tests paths before executing the test.")
        .field ("watch", "boolean", "Watch files for changes and rerun tests related to changed files.")
        .field ("watchPlugins...", "file", "The watch plugins.")
        .field ("bail", "boolean|integer", "Exit the test suite immediately upon n number of failing test suite.", true)
        .field ("testEnvironment", "string", "The test environment that will be used for testing.", "node")
            .constraint ("choice", "node", "jsdom")
        .field ("detectOpenHandles", "boolean", "Attempt to collect and print open handles preventing Jest from exiting cleanly.")
        .field ("forceExit", "boolean", "Force Jest to exit after all tests have completed running.")
        .field ("runInBand", "boolean", "Run all tests serially in the current process, rather than creating a worker pool of child processes that run tests.")
        .field ("maxWorkers", "string", "Specifies the maximum number of workers the worker-pool will spawn for running tests.")

        .staticMethod ("getUncoveredLines", function (results)
        {
            let uncoveredLines = 0;
            let matchedFiles = nit.array (results.testResults).map (r => r.testFilePath.replace (/\/test\/tests\//, "/"));

            nit.each (results.coverageMap?.data, (coverage, path) =>
            {
                if (matchedFiles.includes (path))
                {
                    nit.each (coverage.getLineCoverage (), v => (v || ++uncoveredLines));
                }
            });

            return uncoveredLines;
        })
        .staticMethod ("logUncoveredLines", function (uncoveredLines, trailingNewLine)
        {
            let { bold, yellow, red, green } = Self.Colorizer;
            let color = !uncoveredLines ? green : (uncoveredLines >= 20 ? red : yellow);

            nit.log (bold (`\nTotal Uncovered Lines: ${color (uncoveredLines)}`) + (trailingNewLine === false ? "" : "\n"));
        })
        .method ("run", async function (dir)
        {
            const jest = nit.requireModule ("jest"); // use requireModule so it's testable
            let options = this.toPojo ();

            options.watchAll = options.watch;
            options.config.rootDir = dir;
            options.config = nit.toJson (options.config);

            return await jest.runCLI (options, [dir]);
        })
    ;
};

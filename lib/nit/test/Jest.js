module.exports = function (nit)
{
    return nit.defineClass ("nit.test.Jest")
        .field ("config", "object", "The jest configuration.")
        .field ("testPathPattern...", "string", "A regexp pattern string that is matched against all tests paths before executing the test.")
        .field ("watch", "boolean", "Watch files for changes and rerun tests related to changed files.")
        .field ("testEnvironment", "string", "The test environment that will be used for testing.", "node")
            .constraint ("choice", "node", "jsdom")
        .field ("detectOpenHandles", "boolean", "Attempt to collect and print open handles preventing Jest from exiting cleanly.")

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

module.exports = function (nit)
{
    return nit.defineCommand ("commands.Test")
        .describe ("Perform tests with jest.")
        .defineInput (Input =>
        {
            Input
                .option ("[testPathPattern...]", "string", "A regexp pattern string that is matched against all tests paths before executing the test.")
                .option ("watch", "boolean", "Watch files for changes and rerun tests related to changed files.")
                .option ("testEnvironment", "string", "The test environment that will be used for testing.", "node")
                    .constraint ("choice", "node", "jsdom")

                .option ("dir", "dir", "The working directory.")
                .option ("setupFilesAfterEnv...", "file", "The files that will be added to Jest's setupFilesAfterEnv.", [nit.path.join (nit.NIT_HOME, "test/setup.js")])
                .option ("testMatch...", "string", "The glob patterns Jest uses to detect test files.", ["**/test/tests/**/*.js"])
                .option ("noCollectCoverage", "boolean", "Indicates whether the coverage information should be collected while executing the test.")
                .option ("noVerbose", "boolean", "Indicates whether each individual test should be reported during the run.")
            ;
        })
        .method ("run", async function (ctx)
        {
            let jest = nit.new ("nit.test.Jest");
            let
            {
                dir,
                noCollectCoverage,
                noVerbose,
                setupFilesAfterEnv,
                testMatch,
                testPathPattern,
                testEnvironment,
                watch

            } = ctx.input;

            nit.assign (jest.config,
            {
                collectCoverage: !noCollectCoverage,
                verbose: !noVerbose,
                setupFilesAfterEnv,
                testMatch
            });

            nit.assign (jest,
            {
                testPathPattern,
                testEnvironment,
                watch
            });

            dir = dir || process.cwd ();

            await jest.run (dir);
        })
    ;
};

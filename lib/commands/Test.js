module.exports = function (nit)
{
    return nit.defineCommand ("commands.Test")
        .describe ("Perform tests with jest.")
        .defineInput (Input =>
        {
            Input
                .option ("dir", "dir", "The working directory.")
                .option ("setupFilesAfterEnv...", "file", "The files that will be added to Jest's setupFilesAfterEnv.", [nit.path.join (nit.NIT_HOME, "test/setup.js")])
                .option ("testMatch...", "string", "The glob patterns Jest uses to detect test files.", ["**/test/tests/**/*.js"])
                .option ("noCollectCoverage", "boolean", "Indicates whether the coverage information should be collected while executing the test.")
                .option ("noVerbose", "boolean", "Indicates whether each individual test should be reported during the run.")
            ;
        })
        .method ("run", async function (ctx)
        {
            let
            {
                dir,
                noCollectCoverage,
                noVerbose,
                setupFilesAfterEnv,
                testMatch

            } = ctx.input;

            let jest = nit.new ("nit.test.Jest");

            nit.assign (jest.options,
            {
                collectCoverage: !noCollectCoverage,
                verbose: !noVerbose,
                setupFilesAfterEnv,
                testMatch
            });

            dir = dir || process.cwd ();

            await jest.run (dir);
        })
    ;
};

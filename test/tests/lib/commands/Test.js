test ("commands.Test", async () =>
{
    const nit = await test.setupCliMode ("test", true);
    const Test = nit.lookupCommand ("test");
    const Jest = nit.require ("nit.test.Jest");

    let testDir;

    Jest.method ("run", function (dir)
    {
        testDir = dir;

        return { results: { success: true } };
    });

    test.mock (nit, "log");
    await Test ().run ();

    expect (testDir).toBe (process.cwd ());
});


test ("commands.Test - setupFilesAfterEnv", async () =>
{
    let projectDir = test.pathForProject ("project-a");

    const nit = await test.setupCliMode ("test", projectDir, true);
    const Test = nit.lookupCommand ("test");
    const Jest = nit.require ("nit.test.Jest");

    let testDir;
    let jestConfig;

    Jest.method ("run", function (dir)
    {
        testDir = dir;
        jestConfig = this.config;

        return { results: { success: false } };
    });

    test.mock (nit, "log");
    await Test ().run ({ dir: projectDir });

    expect (testDir).toBe (projectDir);
    expect (jestConfig.setupFilesAfterEnv).toEqual (expect.arrayContaining ([nit.path.join (projectDir, "test/setup.js"), nit.path.join (projectDir, "test/setup.local.js")]));
});


test ("commands.Test - all or packages", async () =>
{
    let projectDir = test.pathForProject ("project-a");

    const nit = await test.setupCliMode ("test", projectDir, true);
    const Test = nit.lookupCommand ("test");
    const Jest = nit.require ("nit.test.Jest");

    let testDirs;
    let logMock;
    let coverage;

    Jest.method ("run", function (dir)
    {
        testDirs.push (dir);

        return {
            results:
            {
                success: true,
                testResults:
                [
                {
                    testFilePath: "path"
                }
                ]
                ,
                coverageMap:
                {
                    data:
                    {
                        "path": { getLineCoverage: function () { return coverage; } }
                    }
                }
            }
        };
    });


    testDirs = [];
    coverage = { 1: 1, 2: 2 };
    logMock = test.mock (nit, "log");
        await Test ().run ({ dir: projectDir, all: true });
        expect (logMock.invocations[0].args[0]).toEqual (expect.stringContaining (Test.Colorizer.green ("0")));
        expect (testDirs).toEqual (
        [
            projectDir,
            nit.path.join (projectDir, "packages/package-a"),
            nit.path.join (projectDir, "packages/package-b")
        ]);

    testDirs = [];
    coverage = { 1: 1, 2: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0 };
    logMock = test.mock (nit, "log");
        await Test ().run ({ dir: projectDir, all: true, packages: "package-b" });
        expect (logMock.invocations[0].args[0]).toEqual (expect.stringContaining (Test.Colorizer.red ("22")));
        expect (testDirs).toEqual (
        [
            projectDir,
            nit.path.join (projectDir, "packages/package-b")
        ]);

    testDirs = [];
    coverage = { 1: 1, 2: 0 };
    logMock = test.mock (nit, "log");
        await Test ().run ({ dir: projectDir, packages: "package-b" });
        expect (logMock.invocations[0].args[0]).toEqual (expect.stringContaining (Test.Colorizer.yellow ("1")));
        expect (testDirs).toEqual ([nit.path.join (projectDir, "packages/package-b")]);

    testDirs = [];
    test.mock (nit, "log");
        await Test ().run ({ dir: projectDir });
        expect (testDirs).toEqual ([projectDir]);
});

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

    await Test ().run ({ dir: projectDir });

    expect (testDir).toBe (projectDir);
    expect (jestConfig.setupFilesAfterEnv).toEqual (expect.arrayContaining ([nit.path.join (projectDir, "test/setup.js"), nit.path.join (projectDir, "test/setup.local.js")]));
});

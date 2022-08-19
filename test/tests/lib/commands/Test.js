test ("commands.Test", async () =>
{
    const nit = await test.setupCliMode ("test", true);
    const Test = nit.lookupCommand ("test");
    const Jest = nit.require ("nit.test.Jest");

    let testDir;

    Jest.method ("run", function (dir)
    {
        testDir = dir;
    });

    await Test.run ();

    expect (testDir).toBe (process.cwd ());
});

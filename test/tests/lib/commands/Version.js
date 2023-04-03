test ("commands.Version", async () =>
{
    const nit = await test.setupCliMode ("version", true);
    const Version = nit.lookupCommand ("version");

    expect (await Version ().run ()).toMatch (/^@pushcorn\/nit/);

    let lines = (await Version ().run ({ verbose: true })).split ("\n");

    expect (lines.some (l => l.match (/^@pushcorn\/nit$/))).toBe (true);
    expect (lines.some (l => l.match (/^\s+Version:/))).toBe (true);
    expect (lines.some (l => l.match (/^\s+Path:/))).toBe (true);

    nit.dpv (nit, "CWD", test.pathForProject ("project-c"));
    expect (await Version ().run ()).toMatch (/^@pushcorn\/nit/);
});

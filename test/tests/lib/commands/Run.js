test ("commands.Run", async () =>
{
    const nit = await test.setupCliMode ("run", true);
    const Run = nit.lookupCommand ("run");

    let file = nit.new ("nit.File", test.pathForProject ("project-c/lib/js/returnString.js"));

    expect (await Run.run ([file.path])).toBe ("return string");
});


test ("commands.Run", async () =>
{
    const nit = await test.setupCliMode ("run", "project-c", true);
    const Run = nit.lookupCommand ("run");

    process.chdir (test.pathForProject ("project-c"));

    let file = nit.new ("nit.File", "lib/js/returnString.js");

    expect (await Run.run ([file.path])).toBe ("return string");
});

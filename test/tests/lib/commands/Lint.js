test ("commands.Lint", async () =>
{
    const nit = await test.setupCliMode ("lint", true);
    const Lint = nit.lookupCommand ("lint");

    let dir = nit.new ("nit.Dir", nit.path.join (nit.os.tmpdir (), nit.uuid ()));
    dir.create ("lib");

    let file = nit.new ("nit.File", dir.join ("lib/myscript.js"));
    file.write ("var a = 3");

    expect (await Lint ().run ("--cwd", dir.path)).toMatch (/Missing semicolon/);

    nit.config ("nit.lint.EsLint.options.cwd", dir.path);
    expect (await Lint ().run ()).toMatch (/Missing semicolon/);

    let rc = nit.new ("nit.File", dir.join (".eslintrc.json"));
    rc.write (nit.toJson ({ env: { node: true }, rules: { semi: "warn" } }));

    nit.config ("nit.lint.EsLint.options", {});
    process.chdir (dir.path);
    expect (await Lint ().run ()).toMatch (/Missing semicolon/);

    expect (await Lint ().run ("--cwd", ".")).toMatch (/Missing semicolon/);
});


test ("commands.Lint - all or packages", async () =>
{
    let projectDir = test.pathForProject ("project-a");

    process.chdir (projectDir);

    const nit = await test.setupCliMode ("lint", projectDir, true);
    const Lint = nit.lookupCommand ("lint");
    const EsLint = nit.require ("nit.lint.EsLint");

    let testDirs;
    let result;
    let results;

    EsLint.method ("lint", function ()
    {
        testDirs.push (this.options.cwd);

        return result;
    });


    result = "";
    testDirs = [];
        await Lint ().run ({ cwd: projectDir, all: true });
        expect (testDirs).toEqual (
        [
            projectDir,
            nit.path.join (projectDir, "packages/package-a"),
            nit.path.join (projectDir, "packages/package-b")
        ]);

    testDirs = [];
    result = "err";
        results = await Lint ().run ({ cwd: projectDir, all: true, packages: "package-b" });
        expect (testDirs).toEqual (
        [
            projectDir,
            nit.path.join (projectDir, "packages/package-b")
        ]);
        expect (results).toEqual (expect.stringContaining (Lint.Colorizer.bold (" packages/package-b ")));

    testDirs = [];
        await Lint ().run ({ cwd: projectDir, packages: "package-b" });
        expect (testDirs).toEqual ([nit.path.join (projectDir, "packages/package-b")]);

    testDirs = [];
        await Lint ().run ({ cwd: projectDir });
        expect (testDirs).toEqual ([projectDir]);
});

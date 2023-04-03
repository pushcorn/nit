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

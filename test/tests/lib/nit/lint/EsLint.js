test ("nit.lint.EsLint.findRc ()", () =>
{
    const EsLint = nit.require ("nit.lint.EsLint");

    expect (EsLint.findRc ()).toBe (nit.path.join (nit.NIT_HOME, ".eslintrc.json"));

    process.chdir (test.pathForProject ("project-a"));
    expect (EsLint.findRc ()).toBeUndefined ();
});

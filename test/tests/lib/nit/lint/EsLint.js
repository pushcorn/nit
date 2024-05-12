test.method ("nit.lint.EsLint", "findRc", true)
    .should ("find the rc file in the working directory")
        .returns ()
        .commit ()

    .reset ()
        .given (nit.path.join (nit.HOME, "test/resources/project-c"))
        .returns (nit.path.join (nit.HOME, "test/resources/project-c/eslint.config.mjs"))
        .commit ()
;


test.method (nit.new ("nit.lint.EsLint",
    {
        options:
        {
            overrideConfigFile: nit.path.join (nit.HOME, "resources/eslint/eslint.config.mjs")
        }
    }), "lint")

    .should ("lint JavaScript files")
        .application ()
        .before (function ()
        {
            this.app.root.writeFile ("lib/myscript.js", "var a = 3");
        })
        .given ("lib/*.js")
        .returns (/Missing semicolon/)
        .commit ()
;

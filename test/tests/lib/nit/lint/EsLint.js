test.method ("nit.lint.EsLint", "findRc", true)
    .should ("find the rc file in the working directory")
    .returns ()
    .commit ()

    .reset ()
    .given (nit.path.join (nit.HOME, "test/resources/project-c"))
    .returns (nit.path.join (nit.HOME, "test/resources/project-c/.eslintrc.json"))
    .commit ()
;


test.method (nit.new ("nit.lint.EsLint",
    {
        options:
        {
            overrideConfigFile: nit.path.join (nit.HOME, "resources/eslint/eslintrc.json")
        }
    }), "lint")

    .should ("lint JavaScript files")
    .app ()
    .before (function ()
    {
        this.application.root.writeFile ("lib/myscript.js", "var a = 3");
    })
    .given ("lib/*.js")
    .returns (/Missing semicolon/)
    .commit ()
;

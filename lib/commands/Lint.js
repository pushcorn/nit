module.exports = function (nit)
{
    return nit.defineCommand ("commands.Lint")
        .describe ("Perform code linting using ESlint.")
        .defineInput (Input =>
        {
            Input
                .option ("cwd", "dir", "The working directory.")
                .option ("errorOnUnmatchedPattern", "boolean", "Whether to throw an error when no target files are found.")
                .option ("patterns...", "string", "The patterns of the files to be linted.",
                [
                    "public/**/*.js",
                    "lib/**/*.js",
                    "exts/**/*.js",
                    "test/**/*.js"
                ])
                .option ("fallbackConfigFile", "nit.File", "The fallback config file to use.", nit.path.join (nit.HOME, "resources/eslint/eslintrc.json"))
            ;
        })
        .method ("run", async function (ctx)
        {
            let { patterns, cwd, errorOnUnmatchedPattern, fallbackConfigFile } = ctx.input;

            let esLint = nit.new ("nit.lint.EsLint");
            let pwd = process.cwd ();

            cwd = cwd || esLint.options.cwd || pwd;

            if (!nit.path.isAbsolute (cwd))
            {
                cwd = nit.path.join (pwd, cwd);
            }

            let rc = nit.lint.EsLint.findRc (cwd);

            if (!rc && !esLint.options.overrideConfigFile)
            {
                esLint.options.overrideConfigFile = fallbackConfigFile.absPath;
            }

            esLint.options.cwd = cwd;
            esLint.options.errorOnUnmatchedPattern = errorOnUnmatchedPattern;

            return await esLint.lint (patterns);
        })
    ;
};

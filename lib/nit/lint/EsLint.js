module.exports = function (nit, Self)
{
    let writer = new nit.Object.Property.Writer;


    return (Self = nit.defineClass ("nit.lint.EsLint"))
        .constant ("RC_PATTERN", /^\.eslintrc\.(js|cjs|yaml|yml|json)$/)
        .staticMethod ("findRc", function (dir)
        {
            dir = dir || process.cwd ();

            for (let f of nit.new ("nit.Dir", dir).read (true))
            {
                if (!f.isDirectory () && f.name.match (Self.RC_PATTERN))
                {
                    return nit.path.join (dir, f.name);
                }
            }
        })
        .field ("options", "object", "The ESLint options.")
        .property ("errorCount", "integer", { writer })
        .property ("results...", "object", { writer })

        .method ("lint", async function (patterns)
        {
            const { ESLint } = nit.requireModule ("eslint");

            let eslint = new ESLint (this.options);
            let results = await eslint.lintFiles (patterns);
            let formatter = await eslint.loadFormatter ("stylish");

            this.results = writer.value (results);
            this.errorCount = writer.value (results.reduce ((a, v) => a + v.errorCount, 0));

            return formatter.format (results);
        })
    ;
};

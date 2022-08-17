module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.lint.EsLint"))
        .constant ("RC_PATTERN", /^\.eslintrc\..*$/)
        .staticMethod ("findRc", function (dir)
        {
            dir = dir || process.cwd ();

            for (let f of nit.new ("nit.Dir", dir).read (true))
            {
                if (!f.isDirectory () && f.name.match (Self.RC_PATTERN))
                {
                    return f.name;
                }
            }
        })
        .field ("options", "object", "The ESLint options.")
        .method ("lint", async function (patterns)
        {
            const { ESLint } = require ("eslint");

            let eslint = new ESLint (this.options);
            let results = await eslint.lintFiles (patterns);
            let formatter = await eslint.loadFormatter ("stylish");

            return formatter.format (results);
        })
    ;
};

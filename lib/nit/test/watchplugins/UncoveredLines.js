const nit = require ("../../../../public/lib/nit");

const Self = (module.exports = nit.defineClass ("nit.test.watchPlugins.UncoveredLines"))
    .use ("nit.test.Jest")
    .method ("apply", function (jestHooks)
    {
        jestHooks.onTestRunComplete (results =>
        {
            let uncoveredLines = Self.Jest.getUncoveredLines (results);

            Self.Jest.logUncoveredLines (uncoveredLines, false);
        });
    })
;

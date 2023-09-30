test ("nit.test.watchplugins.UncoveredLines", () =>
{
    const UncoveredLines = require (nit.path.join (nit.HOME, "lib/nit/test/watchplugins/UncoveredLines"));

    let jestHooks =
    {
        onTestRunComplete: function (cb)
        {
            jestHooks.onTestRunCompleteCb = cb;
        }
    };

    new UncoveredLines ().apply (jestHooks);

    expect (jestHooks.onTestRunCompleteCb).toBeInstanceOf (Function);

    let results =
    {
        testResults:
        [
        {
            testFilePath: "/a/b/test/tests/lib/Class.js"
        }
        ]
        ,
        coverageMap:
        {
            data:
            {
                "/a/b/lib/Class.js":
                {
                    getLineCoverage: function ()
                    {
                        return { 1: 1, 2: 0, 3: 0 };
                    }
                }
                ,
                "/a/b/lib/Object.js":
                {
                    getLineCoverage: function ()
                    {
                        return { 1: 1, 2: 0, 3: 0 };
                    }
                }
            }
        }
    };

    let logMock = test.mock (nit, "log");
    jestHooks.onTestRunCompleteCb (results);
    expect (logMock.invocations[0].args[0]).toMatch (/total uncovered lines:.*2/i);
});

test ("nit.test.Jest", async () =>
{
    nit.requireModule = function ()
    {
        return {
            runCLI: function ()
            {
                return nit.array (arguments);
            }
        };
    };

    const Jest = nit.require ("nit.test.Jest");

    let jest = new Jest ();
    let res = await jest.run (".");

    expect (res[0]).toEqual (
    {
        bail: true,
        config: '{"rootDir":"."}',
        testPathPattern: [],
        watch: false,
        watchAll: false,
        watchPlugins: [],
        testEnvironment: "node",
        detectOpenHandles: false,
        forceExit: false,
        runInBand: false,
        maxWorkers: ""
    });

    expect (res[1]).toEqual (["."]);


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
                    branchMap:
                    {
                        1:
                        {
                            line: 100
                        }
                        ,
                        2:
                        {
                            line: 103
                        }
                    }
                    ,
                    b:
                    {
                        1: [1, 1],
                        2: [0, 1]
                    }
                    ,
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

    expect (Jest.getUncoveredLines (results)).toBe (3);

    let logMock = test.mock (nit, "log", null, 4);
    Jest.logUncoveredLines (3);
    Jest.logUncoveredLines (4, false);
    Jest.logUncoveredLines (20);
    Jest.logUncoveredLines (0);

    expect (logMock.invocations[0].args[0]).toMatch (/uncovered lines:.*3.*\n$/i);
    expect (logMock.invocations[1].args[0]).toMatch (/uncovered lines:.*4.*$/i);
    expect (logMock.invocations[2].args[0]).toMatch (/uncovered lines:.*\x1b\[31m20.*\n$/i); // eslint-disable-line no-control-regex
    expect (logMock.invocations[3].args[0]).toMatch (/uncovered lines:.*\x1b\[32m0.*\n$/i); // eslint-disable-line no-control-regex

});

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
        config: '{"rootDir":"."}',
        testPathPattern: [],
        watch: false,
        testEnvironment: "node"
    });

    expect (res[1]).toEqual (["."]);
});

module.exports = function (nit)
{
    return nit.defineClass ("nit.test.Jest")
        .field ("options", "object", "The jest options.")
        .method ("run", async function (dir)
        {
            const jest = require ("jest");

            this.options.rootDir = dir;

            return await jest.runCLI ({ config: nit.toJson (this.options) }, [dir]);
        })
    ;
};

test.nit = function ()
{
    const path = require ("path");

    process.chdir (path.dirname (__dirname));
    jest.resetModules ();

    return require (process.cwd ());
};

global.nit = test.nit ();

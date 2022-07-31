test.nit = function ()
{
    const path = require ("path");
    const home = path.dirname (__dirname);

    process.argv = [];
    process.chdir (home);
    jest.resetModules ();

    test.HOME = home;
    test.PUBLIC_NIT_PATH = path.join (home, "public/js/nit.js");

    return require (process.cwd ());
};

global.nit = test.nit ();

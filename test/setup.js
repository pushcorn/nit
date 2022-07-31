test.nit = function ()
{
    const path = require ("path");
    const os = require ("os");
    const home = path.dirname (__dirname);

    os._homedir = os.homedir;
    os.homedir = function () { return path.join (home, "test/resources/home/test"); };

    process.argv = [];
    process.chdir (home);
    jest.resetModules ();

    test.HOME = home;
    test.PUBLIC_NIT_PATH = path.join (home, "public/nit.js");

    return require (process.cwd ());
};


test.reloadNit = function (projectPath)
{
    const path = require ("path");

    jest.resetModules ();

    if (projectPath)
    {
        if (projectPath[0] != path.sep)
        {
            projectPath = path.join (test.HOME, projectPath);
        }


        process.env.NIT_PROJECT_PATHS = projectPath;
    }

    return require (test.HOME);
};


global.nit = test.nit ();

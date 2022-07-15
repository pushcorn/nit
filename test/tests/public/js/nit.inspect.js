test ("nit.inspect () logs the input with console.dir ().", () =>
{
    jest.resetModules ();

    const nit_public = require (nit.path.join (nit.HOME, "public/js/nit"));

    let oldDir = console.dir;
    {
        let args;

        console.dir = function ()
        {
            args = nit.array (arguments);
        };

        nit_public.inspect ({ a: 3 });

        expect (args).toEqual ([{ a: 3 }, { depth: undefined }]);
    }
    console.dir = oldDir;

});

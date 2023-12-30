test ("new nit () returns an empty object.", () =>
{
    expect (new nit ()).toEqual ({});
});


test ("nit () returns undefined.", () =>
{
    expect (nit ()).toBeUndefined ();
});


test ("nit.READY", () =>
{
    expect (nit.READY).toBe (true);
});


test ("nit.lookupClass ()", () =>
{
    expect (nit.lookupClass ("constraints.Choice")).toBeInstanceOf (Function);
    expect (() => nit.lookupClass ("constraints.Choice2", true)).toThrow (/class.*not defined/i);
});


test ("nit sets up CJS env in browser env.", async () =>
{
    jest.resetModules ();

    let event;
    let listener;

    global.document =
    {
        addEventListener: function (evt, l)
        {
            event = evt;
            listener = l;
        }
    };

    delete global.nit;
    const nit = require (test.PUBLIC_NIT_PATH);

    nit
        .preInit (async function ()
        {
            await nit.sleep (10);
            nit.preInitCalled = true;
        })
        .init (function ()
        {
            nit.initCalled = true;
        })
        .postInit (function ()
        {
            nit.postInitCalled = true;
        })
    ;

    expect (nit.READY).toBe (false);
    expect (global.module).toBeInstanceOf (Object);
    expect (event).toBe ("DOMContentLoaded");

    await listener ();
    expect (nit.READY).toBe (true);
    expect (nit.initCalled).toBe (true);
    expect (nit.preInitCalled).toBe (true);
    expect (nit.postInitCalled).toBe (true);

    delete global.module;
    delete global.document;
});


test ("nit creates module.exports setter in browser env.", () =>
{
    jest.resetModules ();

    global.document =
    {
        addEventListener: function ()
        {
        }
    };

    delete global.nit;
    require (test.PUBLIC_NIT_PATH);
    const newNit = global.nit;

    let prop = Object.getOwnPropertyDescriptor (global.module, "exports");
    let nitPassedToModule;

    expect (prop.get).toBeUndefined ();
    expect (prop.set).toBeInstanceOf (Function);

    function Module (nit)
    {
        nitPassedToModule = nit;
    }

    global.module.exports = Module;

    expect (nitPassedToModule).toBe (newNit);

    delete global.module;
    delete global.document;
});


test ("nit.lookupComponent", () =>
{
    jest.resetModules ();

    global.document =
    {
        addEventListener: function ()
        {
        }
    };

    delete global.nit;
    require (test.PUBLIC_NIT_PATH);
    const newNit = global.nit;

    let Comp = newNit.defineClass ("a.b.Comp");

    expect (newNit.lookupComponent (Comp)).toBe (Comp);

    delete global.module;
    delete global.document;
});


test ("nit.listComponents ()", () =>
{
    jest.resetModules ();

    global.document =
    {
        addEventListener: function ()
        {
        }
    };

    delete global.nit;
    require (test.PUBLIC_NIT_PATH);
    const newNit = global.nit;

    let constraints = newNit.listComponents ("constraints");
    expect (constraints.some (c => c.name == "exclusive")).toBe (true);

    constraints = newNit.listComponents ("constraints", true);
    expect (constraints.some (n => n == "exclusive")).toBe (true);

    delete global.module;
    delete global.document;
});


test ("check the READY flag", async () =>
{
    jest.resetModules ();

    global.document =
    {
        addEventListener: function (evt, l)
        {
            if (evt == "DOMContentLoaded")
            {
                setTimeout (l, 10);
            }
        }
    };

    delete global.nit;
    require (test.PUBLIC_NIT_PATH);

    let results = [];

    nit.ready (function ()
    {
        results.push (1);
    });

    nit.ready (async function ()
    {
        await nit.sleep (20);

        results.push (2);
    });


    expect (global.module).toBeInstanceOf (Object);

    await nit.sleep (15);
    expect (nit.READY).toBe (false);
    expect (results).toEqual ([1]);

    await nit.sleep (20);
    expect (results).toEqual ([1, 2]);
    expect (nit.READY).toBe (true);

    delete global.module;
    delete global.document;
});


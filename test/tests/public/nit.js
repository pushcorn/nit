test ("new nit () returns an empty object.", () =>
{
    expect (new nit ()).toEqual ({});
});


test ("nit () returns undefined.", () =>
{
    expect (nit ()).toBeUndefined ();
});


test ("nit sets up CJS env in browser env.", () =>
{
    jest.resetModules ();

    global.document = {};
    delete global.nit;
    require (test.PUBLIC_NIT_PATH);

    expect (global.module).toBeInstanceOf (Object);

    delete global.module;
    delete global.document;
});


test ("nit creates module.exports setter in browser env.", () =>
{
    jest.resetModules ();

    global.document = {};
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


test ("nit.listComponents ()", () =>
{
    jest.resetModules ();

    global.document = {};
    delete global.nit;
    require (test.PUBLIC_NIT_PATH);
    const newNit = global.nit;

    let constraints = newNit.listComponents ("constraints");
    expect (constraints.some (c => c.name == "nit:exclusive")).toBe (true);

    constraints = newNit.listComponents ("constraints", true);
    expect (constraints.some (n => n == "nit:exclusive")).toBe (true);

    delete global.module;
    delete global.document;
});

test ("nit.ns () creates the namespace for the given path.", () =>
{
    let obj = {};

    nit.ns ("a.b.c", obj);

    expect (nit.NS.a.b.c).toBe (obj);
    expect (nit.ns ("a.b.c")).toBe (obj);
});


test ("nit.ns.init ()", () =>
{
    nit.ns.init ("app");
    expect (nit.NS.app).toBeInstanceOf (Function);
    expect (nit.NS.app.name).toBe ("app");
    nit.NS.app.tag = "tag";

    nit.ns.init ("app");
    expect (nit.NS.app.tag).toBe ("tag");

    nit.ns.initializer = null;
    nit.ns.init ("mod");
    expect (nit.NS.mod).toEqual ({});
});


test ("nit.ns.invoke ()", () =>
{
    let a, h, self;

    nit.ns.initializer = nit.defineClass;

    nit.ns.invoke (function (app, http, Self)
    {
        a = app;
        h = http;
        self = Self;
    });

    expect (a).toBeInstanceOf (Function);
    expect (h).toBeInstanceOf (Function);
    expect (self).toBeUndefined ();
    expect (a.name).toBe ("app");
    expect (h.name).toBe ("http");

    nit.dpv (nit, "name", "n", true);
    nit.ns.invoke (function (o)
    {
        a = o;
    });

    expect (a).toBe (nit);

    nit.ns.invoke (function (app, ui)
    {
        a = app;
        h = ui;
    });

    expect (a.name).toBe ("app");
    expect (h.name).toBe ("ui");
});

test ("nit.ns.export()", () =>
{
    nit.ns.export ();
    expect (global.app).toBe (nit.NS.app);
});

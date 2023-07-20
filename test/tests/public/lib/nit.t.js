test ("nit.t () - should use classChain to find the superclass if available", () =>
{
    let stream = require ("stream");
    let A;

    (A = nit.defineClass ("A"))
        .extend (stream.Readable, nit.Class)
        .do (() => A.classChain.splice (1, 0, ...nit.Class.classChain))
        .field ("<name>", "string")
    ;

    expect (() => new A).toThrow (/field.*name.*is required/);
});


test ("nit.t () translate a defined message.", () =>
{
    nit.Obj = nit.createFunction ("nit.Obj");
    nit.Sub = nit.createFunction ("nit.Sub");
    nit.extend (nit.Sub, nit.Obj);

    nit.m ("error.empty_name", " The %{type} name cannot be empty.");

    expect (nit.getSuperclass (nit.Sub)).toBe (nit.Obj);

    expect (nit.t ("error.empty_name", { type: "field" })).toBe ("The field name cannot be empty.");
    expect (nit.t ("nit|Obj|error.empty_name", { class: "Obj" })).toBe ("The  name cannot be empty.");

    nit.m (nit.Obj, "error.empty_name", " The name for %{class} cannot be empty.");

    expect (nit.t ("nit|Obj|error.empty_name", { class: "Obj" })).toBe ("The name for Obj cannot be empty.");
    expect (nit.t (nit.Obj, "error.empty_name", { class: "Obj" })).toBe ("The name for Obj cannot be empty.");
    expect (nit.t (nit.Sub, "error.empty_name", { class: "Obj" })).toBe ("The name for Obj cannot be empty.");

    expect (nit.t ("error.invalid_value", { class: "Obj" })).toBe ("error.invalid_value");
    expect (nit.t ("error.invalid_value")).toBe ("error.invalid_value");

    nit.ns.export ();
    nit.ns ("a.b.Sup", nit.createFunction ("a.b.Sup"));
    nit.ns ("c.d.Sub", nit.createFunction ("c.d.Sub"));
    nit.extend (global.c.d.Sub, global.a.b.Sup);

    nit.m.MESSAGES = {};
    nit.m ("c.d", "message", "c.d message");
    expect (nit.t (global.c.d.Sub, "message", { name: "hello" })).toBe ("c.d message");

    nit.m.MESSAGES = {};
    nit.m ("message", "top message");
    expect (nit.t (global.c.d.Sub, "message", { name: "hello" })).toBe ("top message");

    nit.m.MESSAGES = {};
    nit.m ("c.d.Sub", "message", "c.d.Sub message");
    expect (nit.t (global.c.d.Sub, "message", { name: "hello" })).toBe ("c.d.Sub message");

    nit.m.MESSAGES = {};
    nit.m ("a.b", "message", "a.b message");
    expect (nit.t (global.c.d.Sub, "message", { name: "hello" })).toBe ("a.b message");

    nit.m.MESSAGES = {};
    nit.m ("a.b.Sup", "message", "Sup message %{name}");
    expect (nit.t (global.c.d.Sub, "message", { name: "hello" })).toBe ("Sup message hello");

    expect (nit.t ("this is not a key", { name: "hello" })).toBe ("this is not a key");
});

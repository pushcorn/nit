test ("nit.ComponentDescriptor.normalizeName ()", () =>
{
    expect (nit.ComponentDescriptor.normalizeName ("test:my-class")).toBe ("test:my-class");
    expect (nit.ComponentDescriptor.normalizeName ("test.constraints.MyClass")).toBe ("test:constraints:my-class");
    expect (nit.ComponentDescriptor.normalizeName ("testThis.constraints.MyClass")).toBe ("test-this:constraints:my-class");
});


test ("nit.ComponentDescriptor.toClassName ()", () =>
{
    expect (nit.ComponentDescriptor.toClassName ("test:my-class")).toBe ("test.MyClass");
    expect (nit.ComponentDescriptor.toClassName ("test:my-class", "constraints")).toBe ("test.constraints.MyClass");

    expect (nit.ComponentDescriptor.toClassName ("my-class")).toBe ("MyClass");
    expect (nit.ComponentDescriptor.toClassName ("my-class", "constraints")).toBe ("constraints.MyClass");

    expect (nit.ComponentDescriptor.toClassName ("choice")).toBe ("Choice");
    expect (nit.ComponentDescriptor.toClassName ("choice", "constraints")).toBe ("constraints.Choice");

    expect (nit.ComponentDescriptor.toClassName ("test.MyClass")).toBe ("test.MyClass");
    expect (nit.ComponentDescriptor.toClassName ("test.MyClass", "constraints")).toBe ("test.MyClass");
});


test ("nit.ComponentDescriptor.construct ()", () =>
{
    expect (new nit.ComponentDescriptor ("test.constraints.Unique", "constraints").toPojo ()).toEqual (
    {
        category: "constraints",
        className: "test.constraints.Unique",
        name: "test:unique",
        namespace: "test",
        path: ""
    });

    expect (new nit.ComponentDescriptor ("test.proj.constraints.Unique", "constraints").toPojo ()).toEqual (
    {
        category: "constraints",
        className: "test.proj.constraints.Unique",
        name: "test:proj:unique",
        namespace: "test:proj",
        path: ""
    });

    expect (() => new nit.ComponentDescriptor ("test.proj.constraints.Unique", "comps").toPojo ()).toThrow (/class.*Unique.*category.*comps/i);
});


test ("nit.ComponentDescriptor.class", () =>
{
    const A = nit.defineClass ("test.comps.A");

    let cd = new nit.ComponentDescriptor (A.name, "comps");

    expect (cd.class).toBe (A);
    expect (nit.COMPONENT_DESCRIPTORS[A.name]).toBe (cd);
});


test ("nit.ComponentDescriptor.compreTo ()", () =>
{
    const A = nit.defineClass ("test.comps.CompAa");
    const B = nit.defineClass ("test.comps.CompBb");

    let cda = new nit.ComponentDescriptor (A.name, "comps");
    let cdb = new nit.ComponentDescriptor (B.name, "comps");

    expect (cda.compareTo (cdb)).toBe (-1);
    expect (cdb.compareTo (cda)).toBe (1);

    const C = nit.defineClass ("test.cc.comps.CompAa");
    let cdc = new nit.ComponentDescriptor (C.name, "comps");
    expect (cdc.compareTo (cda)).toBe (1);
    expect (cda.compareTo (cdc)).toBe (-1);
});

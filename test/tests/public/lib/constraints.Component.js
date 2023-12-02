test ("constraints.Component", () =>
{
    nit.defineClass ("test.Container").categorize ("test.containers");
    nit.defineClass ("test.containers.Box");

    let Obj = nit.defineClass ("Obj")
        .field ("<container>", "string")
            .constraint ("component", "containers")
    ;

    expect (() => new Obj ("test.User")).toThrow (/component.*invalid/);
    expect (new Obj ("test:box")).toBeInstanceOf (Obj);

    let Obj2 = nit.defineClass ("Obj2")
        .field ("<container>", "string")
            .constraint ("component", "containers", "test.containers.Bottle")
    ;

    expect (() => new Obj2 ("test:box")).toThrow (/superclass.*invalid/);
});

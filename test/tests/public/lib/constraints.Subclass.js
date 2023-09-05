test ("constraints.Subclass", () =>
{
    let Shape = nit.defineClass ("Shape");
    let Circle = Shape.defineSubclass ("Circle");
    let Paper = nit.defineClass ("Paper")
        .field ("<shape>", "string")
            .constraint ("subclass", "Shape")
    ;

    expect (() => new Paper ("nit.Object")).toThrow (/not a subclass.*shape/i);
    expect (new Paper ("Circle")).toBeInstanceOf (Paper);

    let Paper2 = nit.defineClass ("Paper2")
        .field ("<shape>", "function")
            .constraint ("subclass", "Shape")
    ;

    expect (() => new Paper2 (nit.Object)).toThrow (/not a subclass.*shape/i);
    expect (new Paper2 (Circle)).toBeInstanceOf (Paper2);

    let Paper3 = nit.defineClass ("Paper3")
        .field ("<shape>", "function")
            .constraint ("subclass", "Shape2")
    ;

    expect (() => new Paper3 (Circle)).toThrow (/superclass.*is invalid/);

    let Paper4 = nit.defineClass ("Paper4")
        .field ("<shape>", "string")
            .constraint ("subclass", "Shape")
    ;

    expect (new Paper4 (Circle.name).shape).toBe ("Circle");
    expect (() => new Paper4 (Shape.name)).toThrow (/not a subclass of Shape/i);

    let Paper5 = nit.defineClass ("Paper5")
        .field ("<shape>", "string")
            .constraint ("subclass", "Shape", true)
    ;

    expect (new Paper5 (Circle.name).shape).toBe ("Circle");
    expect (new Paper5 (Shape.name).shape).toBe ("Shape");

    let Paper6 = nit.defineClass ("Paper6")
        .field ("<shape>", "integer")
    ;

    expect (() => Paper6.constraint ("subclass", "Shape")).toThrow (/cannot be applied.*integer/);
});

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
});

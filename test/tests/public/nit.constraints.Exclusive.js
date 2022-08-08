test ("nit.constraints.Exclusive", () =>
{
    let Resolver = nit.defineClass ("Resolver")
        .field ("path", "string")
        .field ("pattern", "RegExp")
            .constraint ("exclusive", "path", "pattern")
    ;

    expect (() => new Resolver).toThrow (/must be specified.*path.*pattern/);
    expect (new Resolver ({ path: "/root" })).toBeInstanceOf (Resolver);


    let Resolver2 = nit.defineClass ("Resolver2")
        .field ("path", "string")
        .field ("pattern", "RegExp")
            .constraint ("exclusive", "path", "pattern", { optional: true })
    ;

    expect (new Resolver2).toBeInstanceOf (Resolver2);
});

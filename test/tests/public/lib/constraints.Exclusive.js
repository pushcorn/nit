test ("constraints.Exclusive", () =>
{
    let Resolver = nit.defineClass ("Resolver")
        .field ("path", "string")
        .field ("pattern", "RegExp")
        .check ("exclusive", "path", "pattern")
    ;

    expect (() => new Resolver).toThrow (/must be specified.*path.*pattern/);
    expect (new Resolver ({ path: "/root" })).toBeInstanceOf (Resolver);


    let Resolver2 = nit.defineClass ("Resolver2")
        .field ("path", "string")
        .field ("pattern", "RegExp")
        .check ("exclusive", "path", "pattern", { optional: true })
    ;

    expect (new Resolver2).toBeInstanceOf (Resolver2);


    let Resolver3 = nit.defineClass ("Resolver3")
        .field ("path", "string")
        .field ("pattern", "RegExp")
        .check ("exclusive", "path", "pattern")
    ;

    expect (new Resolver3 ({ pattern: /A/ })).toBeInstanceOf (Resolver3);


    let Resolver4 = nit.defineClass ("Resolver4")
        .field ("path", "string")
        .field ("pattern", "RegExp")
        .check ("exclusive", "path", "pattern")
    ;

    expect (() => new Resolver4 ({ path: "/a", pattern: /A/ })).toThrow (/Exactly one/i);
});

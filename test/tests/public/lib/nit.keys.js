test ("nit.keys () returns the keys of an object", () =>
{
    var a = { a: 1, b: 2 };
    var c = Object.create (a);

    c.f = 9;
    c.g = 10;
    c.a = 11;

    nit.dpv (c, "hidden", "s", false, false);


    expect (nit.keys (a)).toEqual (["a", "b"]);
    expect (nit.keys ({ a: 1, root: 4, global: 5 })).toEqual (["a", "root"]);
    expect (nit.keys (c)).toEqual (["b", "f", "g", "a"]);
    expect (nit.keys (c, true)).toEqual (["b", "f", "g", "a", "hidden"]);

    nit.defineClass ("A")
        .field ("a", "string")
    ;

    const B = nit.defineClass ("B", "A")
        .field ("b", "string")
    ;

    let b = new B ({ a: "aa", b: "bb" });

    expect (nit.keys (b)).toEqual (["a", "b"]);
    expect (nit.keys (b, true)).toEqual (["t", "throw", "toPojo", "a", "b", "$__a", "$__b"]);
});

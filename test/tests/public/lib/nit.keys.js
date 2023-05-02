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
    expect (nit.keys (c)).toEqual (["a", "b", "f", "g"]);
    expect (nit.keys (c, true)).toEqual (["a", "b", "f", "g", "hidden"]);
});

test ("nit.dpvs () defines a set of property values", () =>
{
    var obj = {};

    nit.dpvs (obj,
    {
        a: 3,
        b: function () { return 9; }
    });

    nit.dpvs (obj,
    {
        c: 10

    }, false, false);

    expect (obj.a).toEqual (3);
    expect (obj.b).toBeInstanceOf (Function);
    expect (obj.b.name).toEqual ("b");

    let desc = Object.getOwnPropertyDescriptor (obj, "c");

    expect (desc.configurable).toEqual (false);
    expect (desc.enumerable).toEqual (false);
});

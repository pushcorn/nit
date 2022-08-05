test ("nit.dpv () defines a value property", () =>
{
    var obj = {};

    nit.dpv (obj, "a", 3);
    nit.dpv (obj, "b", function () { return 9; });
    nit.dpv (obj, "c", 10, false, false);

    expect (obj.a).toEqual (3);
    expect (obj.b).toBeInstanceOf (Function);
    expect (obj.b.name).toEqual ("b");

    let desc = Object.getOwnPropertyDescriptor (obj, "c");

    expect (desc.configurable).toEqual (false);
    expect (desc.enumerable).toEqual (false);
});

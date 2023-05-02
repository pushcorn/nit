test ("nit.dpg () defines a getter", () =>
{
    var obj = {};

    nit.dpg (obj, "a", 3);
    nit.dpg (obj, "b", function () { return 9; });
    nit.dpg (obj, "c", 10, false, false);

    expect (obj.a).toEqual (3);
    expect (obj.b).toEqual (9);

    let desc = Object.getOwnPropertyDescriptor (obj, "c");

    expect (desc.configurable).toEqual (false);
    expect (desc.enumerable).toEqual (false);
});

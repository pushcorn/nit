test ("nit.values () returns the values of an object", () =>
{
    var a = { a: 1, b: 2 };

    nit.dpv (a, "hidden", "s", false, false);

    expect (nit.values (a)).toEqual ([1, 2]);
    expect (nit.values ({ a: 1, global: 9 })).toEqual ([1]);
    expect (nit.values (a, true)).toEqual ([1, 2, "s"]);
});

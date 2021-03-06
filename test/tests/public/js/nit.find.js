test ("nit.find () searches for a matching value in an array or object.", () =>
{
    expect (nit.find ([1, 2], (v) => { if (v % 2 == 0) { return v; } })).toBe (2);
    expect (nit.find ([1, 2], "a", 2)).toBeUndefined ();
    expect (nit.find ([1, 2], 2)).toBe (2);
    expect (nit.find ([{ a: 1, b: 9 }, { a: 2, b: 3 }], "a", 2)).toEqual ({ a: 2, b: 3 });
});

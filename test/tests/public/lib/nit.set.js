test ("nit.set () set the value of an object at given path.", () =>
{
    const obj1 = { a: 4, b: { c: 3 } };

    expect (nit.set ({ a: 4 }, "b.c", 3)).toEqual (obj1);
    expect (nit.set ({ a: 4, b: 9 }, "b.c", 3)).toEqual (obj1);
    expect (nit.set ({ a: 4, b: {} }, "b.c", 3)).toEqual (obj1);

    expect (() => nit.set ("string", "b.c", 3)).toThrow (/must be an object/);

    function A () {}

    nit.set (A, "b.c", 1);

    expect (A.b.c).toBe (1);

    expect (nit.set ({ a: 5 }, "")).toEqual ({ a: 5 });

    nit.dpg (A, "d", () => 3, true, false);
    A.d = 9;
    expect (A.d).toBe (3);

    nit.set (A, "d", 9);
    expect (A.d).toBe (3);

    nit.set (A, "d", 9, true);
    expect (A.d).toBe (9);

    nit.set (A, "e.f", 9, true);
    expect (A.e).toEqual ({ f: 9 });
});

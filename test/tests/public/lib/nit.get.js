test ("nit.get () returns the value of an object at the given object path.", () =>
{
    expect (nit.get ({ a: { b: 3 } }, "a.b")).toBe (3);
    expect (nit.get (1, "a.b")).toBeUndefined ();
    expect (nit.get (1, "a.b", 3)).toBeUndefined ();
    expect (nit.get (9)).toBe (9);
    expect (nit.get (nit, "dpg.length")).toBe (5);
    expect (nit.get ({ a: { b: 3 } }, "a.b.9", 1)).toBe (1);
    expect (nit.get ({ a: { b: 3, c: null } }, "a.c", 1)).toBe (1);
    expect (nit.get ({ a: { b: 3, c: null } }, "c", 1)).toBe (1);
});

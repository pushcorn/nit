test ("nit.eval () evaluates an expression and returns the result.", () =>
{
    expect (nit.eval ("{ return; }")).toEqual ({ "": undefined });
    expect (nit.eval ("{ return; }", { a: 4 })).toEqual ({ "": undefined });
    expect (nit.eval ("a * 2", { a: 4 })).toBe (8);
});

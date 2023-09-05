test ("nit.undefIf ()", () =>
{
    expect (nit.undefIf ("", "")).toBeUndefined ();
    expect (nit.undefIf ("a", "")).toBe ("a");
    expect (nit.undefIf ("", nit.is.empty)).toBeUndefined ();
    expect (nit.undefIf ("c", nit.is.empty)).toBe ("c");
});

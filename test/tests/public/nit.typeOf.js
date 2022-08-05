test ("nit.typeOf () returns the type of the input", () =>
{
    expect (nit.typeOf ({})).toBe ("object");
    expect (nit.typeOf (3)).toBe ("number");
});

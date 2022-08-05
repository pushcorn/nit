test ("nit.rpad () returns a string padded from the right", () =>
{
    expect (nit.rpad (3, 4)).toBe ("3000");
    expect (nit.rpad (3, 4, "X")).toBe ("3XXX");
});

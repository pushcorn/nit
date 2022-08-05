test ("nit.lpad () returns a string padded from the left", () =>
{
    expect (nit.lpad (3, 4)).toBe ("0003");
    expect (nit.lpad (3, 4, "X")).toBe ("XXX3");
});

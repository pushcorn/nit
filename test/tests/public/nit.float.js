test ("nit.float () casts a value to a float number", () =>
{
    expect (nit.float ("5.3")).toBe (5.3);
    expect (nit.float ("abc", 100)).toBe (100);
    expect (nit.float ("zzz")).toBe (0);
});

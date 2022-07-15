test ("nit.int () casts a value to an integer", () =>
{
    expect (nit.int ("5")).toBe (5);
    expect (nit.int ("abc", 100)).toBe (100);
    expect (nit.int ("zzz")).toBe (0);
});

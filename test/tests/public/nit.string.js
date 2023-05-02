test ("nit.string ()", () =>
{
    expect (nit.string (3)).toBe ("3");
    expect (nit.string ({})).toBe ("[object Object]");
    expect (nit.string (null)).toBe ("null");
    expect (nit.string (Object.create (null))).toBe ("[object Object]");
});

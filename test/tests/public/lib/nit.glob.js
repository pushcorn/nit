test ("nit.glob ()", () =>
{
    expect (nit.glob ("test.classes.A")).toBe (false);
    expect (nit.glob.parse ("test.classes.A")).toBeInstanceOf (RegExp);
    expect (nit.glob.parse ("test.classes.A")).toEqual (/^test[.]classes[.]A$/i);

    expect (nit.glob ("test.classes.A", "test.*")).toBe (true);
    expect (nit.glob ("test.classes.A", "test.%")).toBe (false);
    expect (nit.glob ("test.classes.A", "~test.%")).toBe (true);
    expect (nit.glob ("test.classes.A", "test.%.%")).toBe (true);
    expect (nit.glob ("test.classes.A", "~test.%.%")).toBe (false);

    expect (nit.glob.parse ("t(e|a)st.*")).toEqual (/^t(e|a)st[.].*$/i);
    expect (nit.glob ("tast.classes.A", "t(e|a)st.*")).toBe (true);
    expect (nit.glob ("tast.classes.A", /^t(e|a)st[.].*$/i)).toBe (true);
    expect (nit.glob ("tast.classes.A", /^abc$/i)).toBe (false);
});

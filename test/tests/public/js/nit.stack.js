test ("nit.stack", () =>
{
    expect (nit.stack.split ("\n")[0].includes (__filename)).toBe (true);
});

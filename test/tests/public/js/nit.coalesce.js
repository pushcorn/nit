test ("nit.coalesce () returns the first non-null arg.", () =>
{
    expect (nit.coalesce (null, undefined, 9)).toBe (9);
    expect (nit.coalesce (null, undefined, 0)).toBe (0);
    expect (nit.coalesce (1, null, undefined)).toBe (1);
});

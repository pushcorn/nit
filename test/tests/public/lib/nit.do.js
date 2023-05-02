test ("nit.do ()", () =>
{
    expect (nit.do (false, () => "")).toBe ("");
    expect (nit.do (false, function () {})).toBe (false);
});

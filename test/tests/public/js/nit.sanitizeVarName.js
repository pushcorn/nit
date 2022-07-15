test ("nit.sanitizeVarName () replace any non-alphanumeric characters to '_'.", () =>
{
    expect (nit.sanitizeVarName ("a.b.c")).toBe ("a_b_c");
    expect (nit.sanitizeVarName ("a-b|c")).toBe ("a_b_c");
});

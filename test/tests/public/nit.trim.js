test ("nit.trim() removes the leading and trailing spaces from a string.", () =>
{
    expect (nit.trim (3)).toBe ("3");
    expect (nit.trim ()).toBe ("");
    expect (nit.trim (null)).toBe ("");
    expect (nit.trim ("   a   ")).toBe ("a");
    expect (nit.trim ("--a----", "-")).toBe ("a");
});

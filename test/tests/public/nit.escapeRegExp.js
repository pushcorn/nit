test ("nit.escapeRegExp () escapes the reserved RegExp chars.", () =>
{
    expect (nit.escapeRegExp ("[]")).toBe ("\\[\\]");
});

test ("nit.camelCase () returns a string in camel case.", () =>
{
    expect (nit.camelCase ("ab-cd")).toBe ("abCd");
    expect (nit.camelCase ("ab_cd")).toBe ("abCd");
    expect (nit.camelCase ("abCd")).toBe ("abCd");
    expect (nit.camelCase ("AbCd")).toBe ("abCd");
});

test ("nit.pascalCase () returns a string in Pascal case.", () =>
{
    expect (nit.pascalCase ("ab-cd")).toBe ("AbCd");
    expect (nit.pascalCase ("ab_cd")).toBe ("AbCd");
    expect (nit.pascalCase ("abCd")).toBe ("AbCd");
    expect (nit.pascalCase ("AbCd")).toBe ("AbCd");
});

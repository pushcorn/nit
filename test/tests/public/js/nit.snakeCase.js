test ("nit.snakeCase () returns a string in snake case.", () =>
{
    expect (nit.snakeCase ("ab-cd")).toBe ("ab_cd");
    expect (nit.snakeCase ("ab_cd")).toBe ("ab_cd");
    expect (nit.snakeCase ("abCd")).toBe ("ab_cd");
    expect (nit.snakeCase ("AbCd")).toBe ("ab_cd");
});

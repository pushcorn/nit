test ("nit.kababCase () returns a string in kabab case.", () =>
{
    expect (nit.kababCase ("ab-cd")).toBe ("ab-cd");
    expect (nit.kababCase ("ab_cd")).toBe ("ab-cd");
    expect (nit.kababCase ("abCd")).toBe ("ab-cd");
    expect (nit.kababCase ("AbCd")).toBe ("ab-cd");
});

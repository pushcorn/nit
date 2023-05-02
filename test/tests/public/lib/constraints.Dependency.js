test ("constraints.Dependency", () =>
{
    let Request = nit.defineClass ("Request")
        .field ("[newPassword]", "string")
        .field ("passwordConfirmation", "string")
        .check ("dependency", "passwordConfirmation", "newPassword")
    ;

    expect (Request ().passwordConfirmation).toBe ("");
    expect (() => Request ("test")).toThrow (/confirmation.*required/i);
    expect (Request ({ passwordConfirmation: "test" }).newPassword).toBe ("");
});

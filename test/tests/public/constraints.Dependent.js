test ("constraints.Dependent", () =>
{
    let Request = nit.defineClass ("Request")
        .field ("[newPassword]", "string")
        .field ("passwordConfirmation", "string")
            .constraint ("dependent", "newPassword")
    ;

    expect (Request ().passwordConfirmation).toBe ("");
    expect (() => Request ("test")).toThrow (/required/);

    let error;

    try
    {
        Request ("test");
    }
    catch (e)
    {
        error = e;
    }

    expect (error.context.property.name).toBe ("passwordConfirmation");
});

test ("nit.Error", () =>
{
    let err = new nit.Error ("Test Error");

    expect (err.message).toBe ("Test Error");
    expect (err).toBeInstanceOf (Error);
    expect (err).toBeInstanceOf (nit.Error);
    expect (err.stack.split ("\n")[1]).toMatch (/^\s*at\sObject\.<anonymous>/);

    Error.captureStackTrace = null;

    err = new nit.Error ("Test Error2");
    expect (err.stack.split ("\n")[1]).toMatch (/^\s*at\sObject\.<anonymous>/);

    const MyError = nit.defineError ("MyError")
        .constant ("STACK_SEARCH_PATTERN", /xyz/)
    ;

    err = new MyError ("Test Error3");
    expect (err.stack).toMatch (/new MyError/);
});

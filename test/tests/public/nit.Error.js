test ("nit.Error", () =>
{
    let err = new nit.Error ("Test Error");

    expect (err.message).toBe ("Test Error");
    expect (err).toBeInstanceOf (Error);
    expect (err).toBeInstanceOf (nit.Error);
    expect (err.stack.split ("\n")[1]).toMatch (/^\s*at\sObject\.<anonymous>/);
    expect (err.name).toBe ("nit.Error");

    Error.captureStackTrace = null;

    err = new nit.Error ("Test Error2");
    expect (err.stack.split ("\n")[1]).toMatch (/^\s*at\sObject\.<anonymous>/);

    const MyError = nit.defineError ("MyError")
        .m ("error.one", "The first error.")
        .constant ("STACK_SEARCH_PATTERN", /xyz/)
        .field ("<reason>", "string")
    ;

    err = new MyError ("Test Error3", "Unknown");

    expect (err.stack).toMatch (/new MyError/);
    expect (err.reason).toBe ("Unknown");
    expect (err.name).toBe ("MyError");

    err = new MyError ("error.one", "Unknown");
    expect (err.message).toBe ("The first error.");

    MyError.defaultCode ("error.two", "The second error.");
    err = new MyError ("", "Unknown");
    expect (err.message).toBe ("The second error.");
});

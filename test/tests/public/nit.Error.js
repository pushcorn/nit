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
        .message ("The first error.")
        .constant ("STACK_SEARCH_PATTERN", /xyz/)
        .field ("<reason>", "string")
    ;

    err = new MyError ("Unknown");

    expect (err.code).toBe ("error.my_error");
    expect (err.stack).toMatch (/new MyError/);
    expect (err.stack).toMatch (/Code: error.my_error$/);
    expect (err.reason).toBe ("Unknown");
    expect (err.name).toBe ("MyError");

    MyError.code ("error.two");
    err = new MyError ("Another reason");
    expect (err.message).toBe ("The first error.");
    expect (err.reason).toBe ("Another reason");


    err = new nit.Error ("The value %{value} is greater than 10", { value: 11 });
    expect (err.message).toBe ("The value 11 is greater than 10");
    expect (err.code).toBe ("");
    expect (err.stack).not.toMatch (/Code:/);
});

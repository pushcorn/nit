test ("mixins.Loggable", () =>
{
    const A = nit.defineClass ("A")
        .m ("error.invalid_request", "The request %{request} is invalid.")
        .mix ("loggable")
    ;

    let a = new A;
    let mock = test.mock (nit, "log");

    a.log ("error.invalid_request", { request: 1234 });

    expect (mock.invocations[0].args[0]).toBe ("The request 1234 is invalid.");
});

test ("mixins.Logger", () =>
{
    const A = nit.defineClass ("A")
        .m ("error.invalid_request", "The request %{request|uppercase} is invalid.")
        .mix ("logger")
    ;

    A.loggerOptions.timestamp = false;
    A.loggerOptions.registerTransform ("uppercase", (s) => s.toUpperCase ());

    let a = new A;
    let mock = test.mock (nit, "log", null, 3);

    a.log ("error.invalid_request", { request: "1234_abcd" });
    a.info ("A custom message %{str|uppercase}.", { str: "abcd" });

    expect (mock.invocations[0].args[0]).toBe ("The request 1234_ABCD is invalid.");
    expect (mock.invocations[1].args[0]).toBe ("[INFO] A custom message ABCD.");

    A.loggerOptions.timestamp = true;

    a.warn ("A message with the timestamp.");
    expect (mock.invocations[2].args[0]).toMatch (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[WARN]/);
});

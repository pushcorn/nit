test ("nit.throw ()", () =>
{
    nit.m ("error.test_failed", "The test failed.");

    expect (() => nit.throw ("error.test_failed")).toThrow (/test failed/);
    expect (() => nit.throw ({ code: "error.test_failed" })).toThrow (/test failed/);
    expect (() => nit.throw ({ code: "error.test_failed", message: "test error" })).toThrow (/test error/);
    expect (() => nit.throw ("This is the error message.")).toThrow (/error message/);
});

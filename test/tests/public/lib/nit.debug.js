test ("nit.debug ()", () =>
{
    expect (nit.debug.PATTERNS.length).toBe (0);

    nit.debug ("~nit.Class");
    expect (nit.debug.PATTERNS[0]).toBeInstanceOf (RegExp);
    expect (nit.debug.PATTERNS[0].negate).toBe (true);

    nit.debug.PATTERNS = [];
    nit.debug ("nit.Class");
    expect (nit.debug.PATTERNS[0].negate).toBe (false);

    let mock = test.mock (nit, "log", null, 2);
    nit.debug ("nit.Object", "obj message");
    nit.debug ("nit.Class", "cls message");
    mock.restore ();

    expect (mock.invocations.length).toBe (1);
    expect (mock.invocations[0].args).toEqual (["[DEBUG] (nit.Class)", "cls message"]);

    mock = test.mock (nit, "log", null, 2);
    nit.debug.PATTERNS = [];
    nit.debug ("~nit.Class");
    nit.debug ("nit.Object", "obj message");
    nit.debug ("nit.Class", "cls message");
    mock.restore ();

    expect (mock.invocations.length).toBe (1);
    expect (mock.invocations[0].args).toEqual (["[DEBUG] (nit.Object)", "obj message"]);
});

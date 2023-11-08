test ("nit.error ()", () =>
{
    const A = nit.defineClass ("A")
        .m ("error.test", "This is the test error: %{reason}")
    ;


    expect (nit.error ("error.test").message).toBe ("error.test");
    expect (nit.error.call (new A, "error.test", { reason: "OOM" }).message).toBe ("This is the test error: OOM");
    expect (nit.error.call (new A, { code: "error.test", stack: "  at line 1\n  at line 2" }, { reason: "OOM" }).stack).toBe (`Error: This is the test error: OOM
  at line 1
  at line 2`);

    expect (nit.error.call (new A, { code: "error.test", trim: 3 }, { reason: "OOM" }).stack.split ("\n")[1]).toMatch (/at new Promise.*/);
    expect (new nit.error ("error.test").stack.split ("\n")[1]).toMatch (__filename);

    function getError ()
    {
        return nit.error.call (new A, "This is error.");
    }

    expect (getError ().stack.split ("\n")[1]).toMatch (__filename);

    expect (nit.error.for (new A, { code: "error.test" }, { reason: "busy" }).stack.split ("\n")[1]).toMatch (__filename);


    let cause = new Error ("Another error");
    let err = nit.error.for (A, { code: "error.test", cause });

    expect (err.stack).toMatch (/Caused by Error: Another/);
});


test ("nit.error.updateMessage ()", () =>
{
    let oldMessage = "line1\nline2";
    let newMessage = "line3\nline4";
    let e = new Error (oldMessage);

    nit.error.updateMessage (e, newMessage);

    expect (e.message).toBe (newMessage);
    expect (e.stack).toMatch (/^Error: line3\nline4\n.*at/);
});

test ("nit.sleep () invokes the callback after the specified delay.", async () =>
{
    let start = Date.now ();
    let delay = 50;

    await nit.sleep (delay + 2);

    expect (Date.now () - start).toBeGreaterThanOrEqual (delay);

     await expect (nit.sleep (delay, () => { throw new Error ("explode"); }))
        .rejects
        .toThrow (/explode/)
    ;

    let p = nit.sleep (100, function () { return 10; });

    setTimeout (function () { p.cancel (1); }, 10);
    let v = await p;

    expect (v).toBe (1);

    p = nit.sleep (100, function () { return 10; });

    p.cancel (new Error ("canceled"));

    expect (() => p).rejects.toThrow ("canceled");
});

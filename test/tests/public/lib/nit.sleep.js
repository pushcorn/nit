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
});

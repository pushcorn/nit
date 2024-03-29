test ("nit.Deferred", async () =>
{
    let d = nit.Deferred ();

    setTimeout (function ()
    {
        d.resolve (100);
    }, 50);

    expect (await d).toBe (100);
    expect (d.resolved).toBe (true);


    //-------------------
    d = nit.Deferred ();

    setTimeout (function ()
    {
        d.reject ("ERR!");
    }, 50);

    let err;

    try
    {
        await d;
    }
    catch (e)
    {
        err = e;
    }

    expect (err).toBe ("ERR!");
    expect (d.resolved).toBe (true);


    //-------------------
    d = nit.Deferred (100);

    try
    {
        await d;
    }
    catch (e)
    {
        err = e;
    }

    expect (err.code).toBe ("error.timeout");
    expect (d.resolved).toBe (true);

    //-------------------
    d = nit.Deferred ();

    setTimeout (function ()
    {
        d.resolve ("OK");
    }, 50);

    expect (await d.promise).toBe ("OK");
    expect (d.resolved).toBe (true);

    //-------------------
    d = nit.Deferred ();

    expect (() => d.reject (new Error ("ERR"))).rejects.toThrow ("ERR");
});

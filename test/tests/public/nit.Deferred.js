test ("nit.Deferred", async () =>
{
    let d = nit.Deferred ();

    setTimeout (function ()
    {
        d.resolve (100);
    }, 50);

    expect (await d).toBe (100);


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

    //-------------------
    d = nit.Deferred ();

    setTimeout (function ()
    {
        d.resolve ("OK");
    }, 50);

    expect (await d.promise).toBe ("OK");
});

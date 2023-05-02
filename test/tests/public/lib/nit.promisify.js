test ("nit.promisify ()", async () =>
{
    function doLater (val, cb)
    {
        setTimeout (function ()
        {
            if (val instanceof Error)
            {
                return cb (val);
            }
            else
            {
                return cb (null, val);
            }

        }, 50);
    }

    let obj = { doLater };


    expect (await nit.promisify (doLater) (9)).toBe (9);
    expect (await nit.promisify (obj, "doLater") (10)).toBe (10);
    expect (await nit.promisify (obj, obj.doLater) (11)).toBe (11);

    await expect (() => nit.promisify (doLater) (new Error ("boom!!"))).rejects.toThrow ("boom!!");

    function resultOnlyFunc (cb)
    {
        setTimeout (function ()
        {
            return cb ("RESULT");
        }, 50);
    }

    expect (await nit.promisify (resultOnlyFunc, true) ()).toBe ("RESULT");
});

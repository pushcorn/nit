test ("nit.cache.Entry", async () =>
{
    let entry = nit.new ("nit.cache.Entry", "test", 3);

    expect (await entry.buildTags ()).toEqual ({});
    expect (await entry.buildValue ()).toBe (3);


    const AsyncEntry = nit.defineClass ("AsyncEntry", "nit.cache.Entry")
        .field ("delay", "integer", "The fetch value delay.", 10)
        .method ("buildTags", async function ()
        {
            return { v: 1 };
        })
        .method ("buildValue", async function ()
        {
            await nit.sleep (this.delay);

            return this.value;
        })
    ;

    let cache2 = nit.new ("nit.Cache", "AsyncEntry");
    expect (await cache2.fetch ("one", {}, 100)).toBe (100);
    expect (cache2.get ("one").version).toMatch (/^[0-9a-f]{32}$/);

    let cache3 = nit.new ("nit.Cache", "AsyncEntry");
    let mainEntry = new AsyncEntry ("main", 10, { delay: 30 });
    let depEntry = new AsyncEntry ("dep", 20, { delay: 10 });

    mainEntry.addDependency (depEntry);
    mainEntry.addDependency (depEntry);
    cache3.put (mainEntry);
    cache3.put (depEntry);

    let mock = test.mock (depEntry, "buildValue", async function ()
    {
        await nit.sleep (20);

        return this.value;
    });
    expect (await cache3.fetch ("main")).toBe (10);
    expect (mock.invocations.length).toBe (1);
    expect (await cache3.fetch ("main")).toBe (10);
    expect (mock.invocations.length).toBe (1);

    let dep2Entry = new AsyncEntry ("dep2", 30);
    mainEntry.addDependency (dep2Entry);

    dep2Entry.buildValue = async function ()
    {
        await nit.sleep (20);

        throw new Error ("ERR");
    };

    expect (() => cache3.fetch ("main")).rejects.toThrow ("ERR");

    let rejectedError;

    setTimeout (function ()
    {
        cache3
            .fetch ("main")
            .catch (function (e)
            {
                rejectedError = e;
            })
        ;
    }, 10);

    await nit.sleep (100);

    expect (rejectedError.message).toBe ("ERR");

});

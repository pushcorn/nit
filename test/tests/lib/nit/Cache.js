test ("nit.Cache", async () =>
{
    const TestEntry = nit.defineClass ("TestEntry", "nit.cache.Entry");

    nit.defineClass ("KeyChangingEntry", "nit.cache.Entry")
        .construct (function (key)
        {
            this.key = "prefix:" + key;
        })
    ;

    let cache = nit.new ("nit.Cache", "TestEntry");

    cache.put (new TestEntry ("aa", "bb"));
    expect (cache.entries.aa.value).toBe ("bb");

    expect (cache.get ("aa").value).toBe ("bb");
    expect (cache.get ("cc").value).toBeUndefined ();
    expect (cache.get ("dd", "dd").value).toBe ("dd");
    expect (await cache.fetch ("dd")).toBe ("dd");

    cache = nit.new ("nit.Cache", "KeyChangingEntry");
    expect (cache.get ("aa").key).toBe ("prefix:aa");
    expect (nit.keys (cache.entries)).toEqual (["prefix:aa"]);
});

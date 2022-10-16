test ("nit.cache.entries.File", async () =>
{
    let fileEntry = nit.new ("nit.cache.entries.File", "package.json");

    expect ((fileEntry.tags = await fileEntry.buildTags ()).path).toBe (nit.resolveAsset ("package.json"));
    expect ((await fileEntry.buildTags ()).mtime).toMatch (/2022/);
    expect (await fileEntry.buildValue ()).toMatch (/@pushcorn\/nit/);

    let fileEntry2 = nit.new ("nit.cache.entries.File", "package.json2");
    expect (() => fileEntry2.buildTags ()).rejects.toThrow (/file.*does not exist./i);
});

test ("nit.cache.entries.File", async () =>
{
    let fileEntry = nit.new ("nit.cache.entries.File", "package.json");

    expect (fileEntry.key).toBe (nit.resolveAsset ("package.json"));
    expect ((fileEntry.tags = await fileEntry.buildTags ()).path).toBe (nit.resolveAsset ("package.json"));
    expect ((await fileEntry.buildTags ()).mtime).toMatch (/2022/);
    expect (await fileEntry.buildValue ()).toMatch (/@pushcorn\/nit/);

    expect (() => nit.new ("nit.cache.entries.File", "package.json2")).toThrow (/file.*was not found./i);
});

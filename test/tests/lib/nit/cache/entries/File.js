test ("nit.cache.entries.File", async () =>
{
    let fileEntry = nit.new ("nit.cache.entries.File", "package.json");

    expect (fileEntry.key).toBe (nit.resolveAsset ("package.json"));
    expect ((fileEntry.tags = await fileEntry.buildTags ()).path).toBe (nit.resolveAsset ("package.json"));
    expect ((await fileEntry.buildTags ()).mtime).toMatch (/^\d{4}-\d{2}-\d{2}T[0-9:.]+Z$/);
    expect (await fileEntry.buildValue ()).toMatch (/@pushcorn\/nit/);

    expect (() => nit.new ("nit.cache.entries.File", "package.json2")).toThrow (/file.*was not found./i);
});

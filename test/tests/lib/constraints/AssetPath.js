test ("constraints.AssetPath", () =>
{
    const A = nit.defineClass ("A")
        .field ("<file>", "file")
            .constraint ("asset-path")
    ;

    let a = new A ("package.json");

    expect (a).toBeInstanceOf (A);
    expect (a.file).toBe (nit.path.join (nit.HOME, "package.json"));
    expect (() => new A ("package.json2")).toThrow (/asset path.*is invalid/);
});

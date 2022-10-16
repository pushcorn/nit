test ("constraints.AssetPath", () =>
{
    const A = nit.defineClass ("A")
        .field ("<file>", "file")
            .constraint ("asset-path")
    ;

    expect (new A ("package.json")).toBeInstanceOf (A);
    expect (() => new A ("package.json2")).toThrow (/asset path.*is invalid/);
});

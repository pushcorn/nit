test ("nit.index ()", () =>
{
    expect (nit.index (["a", "b"])).toEqual ({ a: "a", b: "b" });
    expect (nit.index ([])).toEqual ({});
    expect (nit.index ({})).toEqual ({});
    expect (nit.index ([{ name: "John" }, { name: "Jane" }], "name"))
        .toEqual (
        {
            John: { name: "John" },
            Jane: { name: "Jane" }
        });

    expect (nit.index ([{ name: "John" }, { name: "Jane" }], (o) => o.name.slice (-1)))
        .toEqual (
        {
            n: { name: "John" },
            e: { name: "Jane" }
        });

    expect (nit.index ({ file1: { path: "a/b/c.txt", size: 100 }, file2: { path: "/d/e/f.png", size: 200 } }, "path"))
        .toEqual (
        {
            "a/b/c.txt": { path: "a/b/c.txt", size: 100 },
            "/d/e/f.png": { path: "/d/e/f.png", size: 200 }
        });

    expect (nit.index (["a", "b"], null, true))
        .toEqual ({ a: true, b: true });

    expect (nit.index (["a", "b"], null, (v, i) => v + "=>" + i))
        .toEqual ({ a: "a=>0", b: "b=>1" });
});

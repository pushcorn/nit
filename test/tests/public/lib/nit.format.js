test ("nit.format () prints a formatted string.", () =>
{
    expect (nit.format ("my name is %{name}", { name: "nit" })).toBe ("my name is nit");
    expect (nit.format ("the args are: %{$1}, %{$2}", "a", "b")).toBe ("the args are: a, b");

    const A = nit.defineClass ("A")
        .field ("<id>", "string")
        .getter ("err", function ()
        {
            throw new Error ("ERR");
        })
    ;

    let a = new A ("1234");

    expect (nit.format ("-%{id} %{err}-", a)).toBe ("- -");
});

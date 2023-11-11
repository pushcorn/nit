test ("nit.parseKvp ()", () =>
{
    expect (nit.parseKvp ([undefined, "a=3", { b: 4, d: 5 }, "e=7"]))
        .toEqual ({ a: "3", b: 4, d: 5, e: "7" })
    ;

    expect (nit.parseKvp ([undefined, "a: 3", { b: 4, d: 5 }, "e: 7"], ":"))
        .toEqual ({ a: "3", b: 4, d: 5, e: "7" })
    ;
});

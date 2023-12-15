test ("nit.toPojo ()", () =>
{
    const B = nit.defineClass ("B")
        .field ("vc", "string")
        .field ("vd", "integer")
    ;

    const A = nit.defineClass ("A")
        .field ("va", "string")
        .field ("vb", "B")
    ;

    let a = new A (
    {
        va: "a string",
        vb: new B ({ vc: "c", vd: 10 })
    });

    expect (nit.toPojo ([3, 4])).toEqual ([3, 4]);
    expect (nit.toPojo (a)).toEqual (
    {
        va: "a string",
        vb: { vc: "c", vd: 10 }
    });

    expect (nit.toPojo ([a, { e: 5 }])).toEqual (
    [
        {
            va: "a string",
            vb: { vc: "c", vd: 10 }
        },
        {
            e: 5
        }
    ]);
});

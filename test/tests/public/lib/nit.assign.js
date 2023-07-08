test ("nit.assign ()", () =>
{
    expect (nit.assign ()).toEqual ({});

    let obj = { a: 4 };
    expect (nit.assign (obj, { c: 5 })).toEqual ({ a: 4, c: 5 });
    expect (nit.assign (obj, { c: 5 })).toBe (obj);

    nit.assign (obj, { d: 6, e: 3 }, null, v => v > 3);

    expect (obj).toEqual ({ a: 4, c: 5, d: 6 });
});


test ("nit.assign.defined ()", () =>
{
    let obj = { a: 4 };

    nit.assign.defined (obj, { d: 6, e: null });

    expect (obj).toEqual ({ a: 4, d: 6 });
});

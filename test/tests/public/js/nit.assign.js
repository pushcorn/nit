test ("nit.assign ()", () =>
{
    expect (nit.assign ()).toEqual ({});

    let obj = { a: 4 };
    expect (nit.assign (obj, { c: 5 })).toEqual ({ a: 4, c: 5 });
    expect (nit.assign (obj, { c: 5 })).toBe (obj);
});

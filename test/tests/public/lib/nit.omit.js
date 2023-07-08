test ("nit.omit ()", () =>
{
    expect (nit.omit ({ a: 3, b: 4, d: 5 }, "a", "d")).toEqual ({ b: 4 });
    expect (nit.omit ({ a: 3, b: { e: 4, d: 5 } }, "b.d")).toEqual ({ a: 3, b: { e: 4 } });
    expect (nit.omit ({ a: 3, b: { e: 4, d: 5 } }, "b.e.g")).toEqual ({ a: 3, b: { d: 5, e: 4 } });
});

test ("nit.pick ()", () =>
{
    expect (nit.pick ({ a: 3, b: 4, d: 5 }, "a", "d")).toEqual ({ a: 3, d: 5 });
    expect (nit.pick ({ a: 3, b: 4, d: 5 }, "e")).toEqual ({});
});

test ("nit.entries ()", () =>
{
    expect (nit.entries ()).toEqual ([]);
    expect (nit.entries ({ a: 3, b: 4 })).toEqual ([{ k: "a", v: 3 }, { k: "b", v: 4 }]);
    expect (nit.entries ([1, 2])).toEqual ([{ k: "0", v: 1 }, { k: "1", v: 2 }]);

    const A = nit.defineClass ("A")
        .field ("f1", "integer", "f1", 3)
        .field ("f2", "integer", "f1", 4)
    ;

    expect (nit.entries (new A)).toEqual ([{ k: "f1", v: 3 }, { k: "f2", v: 4 }]);
    expect (nit.entries (A)).toEqual ([]);
});

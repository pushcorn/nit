test ("nit.argsToObj () combines the arguments into an object.", () =>
{
    expect (nit.argsToObj ([1, 2, { a: 3 }, { b: 4 }, { c: undefined }, undefined]))
        .toStrictEqual ({ 0: 1, 1: 2, 2: undefined, a: 3, b: 4, c: undefined });

    expect (nit.argsToObj ([1, 2, { a: 3 }, { b: 4 }, { c: undefined }, undefined], ["a1", "a2", "a3", "a4"]))
        .toStrictEqual ({ 0: 1, 1: 2, 2: undefined, a: 3, b: 4, c: undefined, a1: 1, a2: 2 });

    let Obj = function () {};
    {
        expect (nit.argsToObj ([1, 2, { a: 3 }, new Obj]))
            .toStrictEqual ({ 0: 1, 1: 2, 2: new Obj, a: 3 });
    }

    let o = nit.argsToObj ([1, 2, { a: 3 }, { b: 4 }, { c: undefined }, undefined], ["a1", "a2"]);
    {
        expect (nit.argsToObj.cleanup (o)).toStrictEqual ({ a: 3, b: 4, c: undefined, a1: 1, a2: 2 });
    }

    expect (nit.argsToObj ([1], ["first"], true)).toEqual ({ first: 1 });
});

test ("nit.find () searches for a matching value in an array or object.", async () =>
{
    expect (nit.find ([1, 2], (v) => { if (v % 2 == 0) { return v; } })).toBe (2);
    expect (nit.find ([1, 2], "a", 2)).toBeUndefined ();
    expect (nit.find ([1, 2], 2)).toBe (2);
    expect (nit.find ([{ a: 1, b: 9 }, { a: 2, b: 3 }], "a", 2)).toEqual ({ a: 2, b: 3 });

    let o = { a: 3, b: 2, c: 1 };

    expect (await nit.find (o, async function (v)
    {
        await nit.sleep (10);

        if (v <= 2)
        {
            return nit.find.Result ("less than 2");
        }

    })).toBe ("less than 2");
});


test ("nit.find.result ()", async () =>
{
    let o = { a: 3, b: 2, c: 1 };

    expect (await nit.find.result (o, async function (v)
    {
        await nit.sleep (10);

        if (v <= 2)
        {
            return v * 2;
        }

    })).toBe (4);
});

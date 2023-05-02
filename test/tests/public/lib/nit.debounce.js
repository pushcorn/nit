test ("nit.debounce", async () =>
{
    let values = [];

    let inc = nit.debounce (10, function (v)
    {
        values.push (v);
    });

    inc (1);
    inc (2);
    inc (3);

    await nit.sleep (40);

    expect (values).toEqual ([3]);

    nit.debounce.DELAY = 100;

    inc = nit.debounce (function (v)
    {
        values.push (v);
    });

    inc (4);
    await nit.sleep (150);
    expect (values).toEqual ([3, 4]);
});

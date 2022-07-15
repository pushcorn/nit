test ("nit.arrayInsert () inserts an element before another element.", () =>
{
    expect (nit.arrayInsert ([1, 3, 5], 9, 1)).toEqual ([9, 1, 3, 5]);
    expect (nit.arrayInsert ([1, 3, 5], 9)).toEqual ([1, 3, 5, 9]);
    expect (nit.arrayInsert ([1, 3, 5], 10, (v) => v > 3)).toEqual ([1, 3, 10, 5]);
});

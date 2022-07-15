test ("nit.each () walks an object or array with a function.", async () =>
{
    expect (nit.each ([1, 2], (v) => v * 2)).toEqual ([2, 4]);
    expect (nit.each ([1, 2], (v) => v * 2, true)).toEqual ([2, 4]);
    expect (nit.each ([1, 2], "$VALUE * 2")).toEqual ([2, 4]);
    expect (nit.each ({ a: 1, b: 2 }, (v) => v * 2, true)).toEqual ([2, 4]);
    expect (nit.each ({ 0: 1, 1: 2, length: 2 }, (v) => v * 2)).toEqual ([2, 4]);
    expect (nit.each ([1, 2], "$KEY")).toEqual ([0, 1]);
    expect (nit.each ({ a: 1, b: 2 }, "$KEY")).toEqual (["a", "b"]);
    expect (nit.each ([], "$KEY")).toEqual ([]);

    let i = 0;

    expect (nit.each ([1, 2, 3, 4], (v) => (i++ > 2 ? nit.each.STOP : v * 2))).toEqual ([2, 4, 6]);
    expect (nit.each ([1, 2, 3, 4], (v, k) => (k == 2 ? nit.each.SKIP : v * 2))).toEqual ([2, 4, 8]);
    expect (nit.each ([1, 2, 3, 4], (v, k) => (k == 2 ? nit.each.SKIP : undefined))).toEqual ([1, 2, 4]);

    expect (nit.each ([1, 2, 3], async (v) => v * 2)).toBeInstanceOf (Promise);
    expect (await nit.each ([1, 2, 3], async (v) => v * 2)).toEqual ([2, 4, 6]);
});

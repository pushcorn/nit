test ("nit.insertBefore () inserts an element before another element.", () =>
{
    let a;

    expect (nit.insertBefore (a = [1, 3, 5], 9, 1)).toBe (true);
    expect (a).toEqual ([9, 1, 3, 5]);

    expect (nit.insertBefore (a = [1, 3, 5], 9)).toBe (false);
    expect (a).toEqual ([1, 3, 5]);

    expect (nit.insertBefore (a = [1, 3, 5], 10, (v) => v > 3)).toBe (true);
    expect (a).toEqual ([1, 3, 10, 5]);
});

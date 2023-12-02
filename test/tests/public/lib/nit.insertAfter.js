test ("nit.insertAfter () inserts an element after another element.", () =>
{
    let a;

    expect (nit.insertAfter (a = [1, 3, 5], 9, 1)).toBe (true);
    expect (a).toEqual ([1, 9, 3, 5]);

    expect (nit.insertAfter (a = [1, 3, 5], 9)).toBe (false);
    expect (a).toEqual ([1, 3, 5]);

    expect (nit.insertAfter (a = [1, 3, 5], 10, (v) => v > 3)).toBe (true);
    expect (a).toEqual ([1, 3, 5, 10]);

    expect (nit.insertAfter (a = ["b", "b", "c"], "d", "b")).toBe (true);
    expect (a).toEqual (["b", "b", "d", "c"]);
});

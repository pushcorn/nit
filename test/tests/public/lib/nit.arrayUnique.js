test ("nit.arrayUnique () removes duplicate elements from an array.", () =>
{
    expect (nit.arrayUnique ([1, 5, 5, 3])).toEqual ([1, 5, 3]);
    expect (nit.arrayUnique ([1, 5, "5", 3])).toEqual ([1, 5, "5", 3]);
    expect (nit.arrayUnique ([])).toEqual ([]);
    expect (nit.arrayUnique ([9])).toEqual ([9]);

    let a = {};

    expect (nit.arrayUnique ([a, a, a], true)[0]).toBe (a);
});

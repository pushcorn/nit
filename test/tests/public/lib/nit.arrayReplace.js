test ("nit.arrayReplace ()", () =>
{
    let a = [3, 4, 5];

    expect (nit.arrayReplace (a, 9, 4)).toEqual (4);
    expect (nit.arrayReplace (a, 9, 6)).toBeUndefined ();
});

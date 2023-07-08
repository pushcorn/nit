test ("nit.arrayCombine () combines 2 arrays into an object.", () =>
{
    let keys = ["a", "b", "c"];
    let vals = [1, 2, 3];

    expect (nit.arrayCombine (keys, vals)).toEqual ({ a: 1, b: 2, c: 3 });
});


test ("nit.arrayRemove.nested ()", () =>
{
    expect (nit.arrayCombine.nested (["a", "b"], [[1, 2], [3, 4]]))
        .toEqual ([{ a: 1, b: 3 }, { a: 2, b: 4 }])
    ;
});

test ("nit.arrayRemove () removes the matching element from an array.", () =>
{
    expect (nit.arrayRemove (3)).toEqual ([]);

    let arr1 = [1, 3, 5];
    {
        let removed = nit.arrayRemove (arr1, 3);

        expect (arr1).toEqual ([1, 5]);
        expect (removed).toEqual ([3]);
    }

    let arr2 = [1, 3, 5];
    {
        let removed = nit.arrayRemove (arr2, function (v) { return v >= 3; });

        expect (arr2).toEqual ([1]);
        expect (removed).toEqual ([3, 5]);
    }
});

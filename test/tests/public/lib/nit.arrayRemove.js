test ("nit.arrayRemove () removes the matching element from an array.", () =>
{
    expect (nit.arrayRemove (3)).toEqual ([]);
    expect (nit.arrayRemove (3, 9, true)).toBeUndefined ();

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

    let arr3 = [1, 3, 3, 5, 9, 10];
    {
        let removed = nit.arrayRemove (arr3, function (v) { return v >= 3; });

        expect (arr3).toEqual ([1]);
        expect (removed).toEqual ([3, 3, 5, 9, 10]);
    }

    let arr4 = [1, 3, 3, 5, 9, 10];
    {
        let removed = nit.arrayRemove (arr4, function (v) { return v >= 3; }, true);

        expect (arr4).toEqual ([1, 3, 5, 9, 10]);
        expect (removed).toEqual (3);
    }
});

test ("nit.array () converts the input to an array.", () =>
{
    expect (nit.array (null)).toEqual ([]);
    expect (nit.array (undefined)).toEqual ([]);
    expect (nit.array ({ length: 2, 0: 1, 1: 2 })).toEqual ([1, 2]);
    expect (nit.array ({ length: 2, 0: 1, 1: [3, 4] }, true)).toEqual ([1, 3, 4]);
    expect (nit.array ("str", false)).toEqual (["str"]);
});

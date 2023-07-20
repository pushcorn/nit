test ("nit.sort.COMPARATORS.undef ()", () =>
{
    let comp = nit.sort.COMPARATORS.undef;

    expect (comp (null, null)).toEqual (0);
    expect (comp (3, null)).toEqual (-1);
    expect (comp (3, 9)).toEqual (0);
    expect (comp (3, "abc")).toEqual (0);
    expect (comp (undefined, 10)).toEqual (1);
});


test ("nit.sort.COMPARATORS.string ()", () =>
{
    let comp = nit.sort.COMPARATORS.string;

    expect (comp (null, null)).toEqual (0);
    expect (comp (3, null)).toEqual (-1);
    expect (comp (3, 9)).toEqual (-1);
    expect (comp (3, "abc")).toEqual (-1);
    expect (comp ("A", "a")).toEqual (-1);
    expect (comp (undefined, 10)).toEqual (1);
});


test ("nit.sort.COMPARATORS.cistring ()", () =>
{
    let comp = nit.sort.COMPARATORS.cistring;

    expect (comp (null, null)).toEqual (0);
    expect (comp (3, null)).toEqual (-1);
    expect (comp (3, 9)).toEqual (-1);
    expect (comp (3, "abc")).toEqual (-1);
    expect (comp ("A", "a")).toEqual (0);
    expect (comp (undefined, 10)).toEqual (1);
});


test ("nit.sort.COMPARATORS.integer ()", () =>
{
    let comp = nit.sort.COMPARATORS.integer;

    expect (comp (null, null)).toEqual (0);
    expect (comp (3, null)).toEqual (-1);
    expect (comp (3, 9)).toEqual (-1);
    expect (comp (3, "abc")).toEqual (1); // string will be 0
    expect (comp ("A", "a")).toEqual (0);
    expect (comp (undefined, 10)).toEqual (1);
});


test ("nit.sort.COMPARATORS.float ()", () =>
{
    let comp = nit.sort.COMPARATORS.float;

    expect (comp (null, null)).toEqual (0);
    expect (comp (3, null)).toEqual (-1);
    expect (comp (3.2, "3.1")).toEqual (1);
    expect (comp ("3.1", 3.2)).toEqual (-1);
    expect (comp (3, "abc")).toEqual (1);
    expect (comp ("A", "a")).toEqual (0);
    expect (comp (undefined, 10)).toEqual (1);
});


test ("nit.sort.COMPARATORS.auto ()", () =>
{
    let comp = nit.sort.COMPARATORS.auto;

    expect (comp (null, null)).toEqual (0);
    expect (comp (3, null)).toEqual (-1);
    expect (comp (3.2, "3.1")).toEqual (1);
    expect (comp (3, "abc")).toEqual (1);
    expect (comp ("A", "a")).toEqual (-1);
    expect (comp (undefined, 10)).toEqual (1);
});


test ("nit.sort ()", () =>
{
    expect (nit.sort ([2, 5, 1])).toEqual ([1, 2, 5]);
    expect (nit.sort ([2, 5, 1])).toEqual ([1, 2, 5]);
    expect (nit.sort ([2, 5, 1], true)).toEqual ([5, 2, 1]);
    expect (nit.sort ([2, 5, 1], (a, b) => b - a)).toEqual ([5, 2, 1]);

    let arr =
    [
    {
        name: "name A"
    }
    ,
    {
        name: "Name B"
    }
    ];

    expect (nit.sort (arr.slice (), "name")).toEqual (arr.slice ().reverse ());
    expect (nit.sort (arr.slice (), "name", true)).toEqual (arr.slice ());

    expect (nit.sort (arr.slice (), { name: "cistring" })).toEqual (arr.slice ());
    expect (nit.sort (arr.slice (), { name: "cistring" }, true)).toEqual (arr.slice ().reverse ());

    arr =
    [
    {
        name: "name A",
        order: 3
    }
    ,
    {
        name: "name A",
        order: 1
    }
    ,
    {
        name: "name B",
        order: 1
    }
    ];

    expect (nit.sort (arr.slice (), { order: null })).toEqual (
    [
        { name: "name A", order: 1 },
        { name: "name B", order: 1 },
        { name: "name A", order: 3 }
    ]);
    expect (nit.sort (arr.slice (), "order", true)).toEqual (arr.slice ());
    expect (nit.sort (arr.slice (), { order: null, name: null }, { order: false })).toEqual (
    [
        { name: "name A", order: 1 },
        { name: "name B", order: 1 },
        { name: "name A", order: 3 }
    ]);

    expect (nit.sort (arr.slice (), { order: null, name: null }, { order: false, name: true })).toEqual (
    [
        { name: "name B", order: 1 },
        { name: "name A", order: 1 },
        { name: "name A", order: 3 }
    ]);
});

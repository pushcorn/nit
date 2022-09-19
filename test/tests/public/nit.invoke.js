test ("nit.invoke ()", async () =>
{
    function add (a, b)
    {
        return a + b;
    }

    function inc (field)
    {
        return ++this[field];
    }

    let obj = { cnt: 9 };

    expect (nit.invoke (add, [1, 2])).toBe (3);
    expect (nit.invoke (add)).toBe (NaN);
    expect (nit.invoke ([obj, inc], "cnt")).toBe (10);

    obj.inc = inc;
    expect (nit.invoke ([obj, "inc"], "cnt")).toBe (11);

    obj.incLater = async function (field)
    {
        return (this[field] += 2);
    };

    expect (nit.invoke ([obj, "incLater"], "cnt")).toBeInstanceOf (Promise);
    await nit.sleep (10);
    expect (obj.cnt).toBe (13);

    obj.getVal = function (field)
    {
        return this[field];
    };

    obj.getValLater = async function (field)
    {
        return this[field];
    };

    expect (nit.invoke ([obj, "getVal"], "cnt")).toBe (13);
    expect (nit.invoke ([obj, "getVal"], "name")).toBeUndefined ();
    expect (nit.invoke ([obj, "getVal"], "name", "obj")).toBe ("obj");

    expect (nit.invoke ([obj, "getValLater"], "name", "obj2")).toBeInstanceOf (Promise);
    expect (await nit.invoke ([obj, "getValLater"], "name", "obj3")).toBe ("obj3");

    expect (nit.invoke ([obj, "getVal2"])).toBeUndefined ();
    expect (nit.invoke (null, null, 100)).toBe (100);
});

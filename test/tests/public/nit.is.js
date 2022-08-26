test ("nit.is () checks the type of the input.", function ()
{
    expect (nit.is ()).toBe (false);
    expect (nit.is (true, "boolean")).toBe (true);
    expect (nit.is (null, "object")).toBe (false);
    expect (nit.is (undefined, "object")).toBe (false);

    expect (nit.is.str ("string")).toBe (true);
    expect (nit.is.str (3)).toBe (false);

    expect (nit.is.num ("string")).toBe (false);
    expect (nit.is.num (3)).toBe (true);

    expect (nit.is.int ("string")).toBe (false);
    expect (nit.is.int (3)).toBe (true);
    expect (nit.is.int (3.3)).toBe (false);

    expect (nit.is.bool ("string")).toBe (false);
    expect (nit.is.bool (true)).toBe (true);

    expect (nit.is.arr ("string")).toBe (false);
    expect (nit.is.arr ([3])).toBe (true);

    expect (nit.is.obj ("string")).toBe (false);
    expect (nit.is.obj ({ a: 3 })).toBe (true);

    expect (nit.is.async ("string")).toBe (false);
    expect (nit.is.async (async function () {})).toBe (true);

    expect (nit.is.undef ("string")).toBe (false);
    expect (nit.is.undef (null)).toBe (true);
    expect (nit.is.undef (undefined)).toBe (true);
    expect (nit.is.undef ()).toBe (true);

    expect (nit.is.arrayish ("string")).toBe (false);
    expect (nit.is.arrayish ([])).toBe (true);
    expect (nit.is.arrayish (new Int8Array (8))).toBe (true);
    expect (nit.is.arrayish (arguments)).toBe (true);
    expect (nit.is.arrayish ({ length: 9 })).toBe (true);

    expect (nit.is.symbol ("string")).toBe (false);
    expect (nit.is.symbol (Symbol ("S"))).toBe (true);

    expect (nit.is.typedArray ("string")).toBe (false);
    expect (nit.is.typedArray (new Int8Array (8))).toBe (true);

    expect (nit.is.buffer ("string")).toBe (false);
    expect (nit.is.buffer (Buffer.from ("buffer"))).toBe (true);

    expect (nit.is.promise ("string")).toBe (false);
    expect (nit.is.promise (Promise.resolve (3))).toBe (true);

    expect (nit.is.instanceOf ("string", String)).toBe (false);
    expect (nit.is.instanceOf (new nit, nit)).toBe (true);

    function Sup () {}
    function Sub () {}

    nit.extend (Sub, Sup);

    expect (nit.is.subclassOf (Sub, Sup)).toBe (true);
    expect (nit.is.subclassOf (Sub, nit)).toBe (false);

    expect (nit.is.keyword ("string")).toBe (false);
    expect (nit.is.keyword ("break")).toBe (true);

    expect (nit.is.pojo ("string")).toBe (false);
    expect (nit.is.pojo ({})).toBe (true);
    expect (nit.is.pojo (new Sup)).toBe (false);

    expect (nit.is.equal ("string", 3)).toBe (false);
    expect (nit.is.equal ({ a: 3 }, { a: 3 })).toBe (true);
    expect (nit.is.equal ({ a: 3, b: { c: 2 } }, { a: 3, b: { c: 2 } })).toBe (true);
    expect (nit.is.equal ([3, 4], [3, 4])).toBe (true);
    expect (nit.is.equal ([3, 4], [3, 4, 5])).toBe (false);
    expect (nit.is.equal ([3, 4, 1], [3, 4, 5])).toBe (false);
    expect (nit.is.equal (new Date, new Date)).toBe (true);

    expect (nit.is.empty (new Date)).toBe (false);
    expect (nit.is.empty ()).toBe (true);
    expect (nit.is.empty (null)).toBe (true);
    expect (nit.is.empty ([])).toBe (true);
    expect (nit.is.empty ({})).toBe (true);
    expect (nit.is.empty ({ a: 1 })).toBe (false);
    expect (nit.is.empty ([3])).toBe (false);
    expect (nit.is.empty ({ "": 1 })).toBe (false);

    expect (nit.is.truthy (new Date)).toBe (true);
    expect (nit.is.truthy (false)).toBe (false);
    expect (nit.is.truthy ({})).toBe (false);
    expect (nit.is.truthy (true)).toBe (true);
    expect (nit.is.truthy (0)).toBe (false);

    expect (nit.is.not.truthy (0)).toBe (true);
});

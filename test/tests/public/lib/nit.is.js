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
    expect (nit.is.arrayish (Buffer.from ("test"))).toBe (false);

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
    expect (nit.is.equal.strict (Sup, Sup)).toBe (true);

    let a =
    {
        a: 3,
        b: [4, 5],
        d:
        {
            e: [{ k: 10 }, { k: 11 }, { k: 22 }]
        }
        ,
        fa: function fa () {},
        fb: { name: "fb" },
        e:
        {
            d:
            {
                f: 9,
                g: 10
            }
        }
    };

    let b =
    {
        a: 3,
        d:
        {
            e: [{ k: 10 }, { k: 11 }]
        }
        ,
        fa: { name: "fa" },
        fb: function fb () {},
        e:
        {
            d:
            {
                g: 10
            }
        }
    };

    expect (nit.is.equal.partial (a, b)).toBe (true);
    expect (nit.is.equal.partial ([1, 2], [5])).toBe (false);

    expect (nit.is.empty (new Date)).toBe (false);
    expect (nit.is.empty ()).toBe (true);
    expect (nit.is.empty (null)).toBe (true);
    expect (nit.is.empty ([])).toBe (true);
    expect (nit.is.empty ({})).toBe (true);
    expect (nit.is.empty ({ a: 1 })).toBe (false);
    expect (nit.is.empty ([3])).toBe (false);
    expect (nit.is.empty ({ "": 1 })).toBe (false);

    expect (nit.is.empty.nested ({ a: null })).toBe (true);
    expect (nit.is.empty.nested ({ a: { b: null }})).toBe (true);
    expect (nit.is.empty.nested ({ a: { b: [] }})).toBe (true);
    expect (nit.is.empty.nested ([null, undefined, []])).toBe (true);
    expect (nit.is.empty.nested ("")).toBe (true);
    expect (nit.is.empty.nested (nit.object ({ b: "" }))).toBe (true);
    expect (nit.is.empty.nested ({ a: nit.object () })).toBe (true);
    expect (nit.is.empty.nested (10)).toBe (false);
    expect (nit.is.empty.nested ({ a: 10 })).toBe (false);

    expect (nit.is.truthy (new Date)).toBe (true);
    expect (nit.is.truthy (false)).toBe (false);
    expect (nit.is.truthy ({})).toBe (false);
    expect (nit.is.truthy (true)).toBe (true);
    expect (nit.is.truthy (0)).toBe (false);

    expect (nit.is.not.truthy (0)).toBe (true);

    expect (nit.is.any (0)).toBe (true);
    expect (nit.is.any ({})).toBe (true);

    expect (nit.is.dto ({})).toBe (true);
    expect (nit.is.dto (nit.object ({}))).toBe (true);

    const A = nit.defineClass ("A", true);
    expect (nit.is.privateClass (A)).toBe (true);

    expect (nit.is.errorish (new Error)).toBe (true);
    expect (nit.is.errorish ("a")).toBe (false);
    expect (nit.is.errorish ()).toBe (false);
    expect (nit.is.errorish ({ stack: "", message: "" })).toBe (true);
});

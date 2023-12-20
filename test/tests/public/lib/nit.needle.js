test ("nit.needle ()", () =>
{
    function check (v, tv, res)
    {
        expect (nit.needle (v) (tv)).toBe (res);
    }

    const A = nit.defineClass ("A")
        .field ("a", "integer")
        .field ("b", "integer")
    ;


    check (3, 3, true);
    check (3, 9, false);
    check (function (v) { return v > 10; }, 9, false);
    check (function () { return "yes"; }, 100, true);
    check (/^ab.cd/, "ab.cdef", true);
    check (/^ab.cd/, "cdef", false);
    check ({ a: 1 }, { a: 1, b: 2 }, true);
    check ({ a: 1 }, new A ({ a: 1, b: 2 }), true);
    check ({ a: 3 }, { a: 1, b: 2 }, false);
});

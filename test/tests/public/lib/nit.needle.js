test ("nit.needle ()", () =>
{
    function check (v, tv, res)
    {
        expect (nit.needle (v) (tv)).toBe (res);
    }

    check (3, 3, true);
    check (3, 9, false);
    check (function (v) { return v > 10; }, 9, false);
    check (function () { return "yes"; }, 100, true);
    check (/^ab.cd/, "ab.cdef", true);
    check (/^ab.cd/, "cdef", false);
});

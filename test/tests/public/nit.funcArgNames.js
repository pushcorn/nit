test ("nit.funcArgNames () extracts the argument names from the function declaration.", () =>
{
    function A (a,
        b, /* ---- */
        d,
        e
    ) { nit.log (a, b, d, e); }

    function B (a,b) {} // eslint-disable-line no-unused-vars
    function C () {}

    expect (nit.funcArgNames (A)).toEqual (["a", "b", "d", "e"]);
    expect (nit.funcArgNames (B)).toEqual (["a", "b"]);
    expect (nit.funcArgNames (C)).toEqual ([]);
});

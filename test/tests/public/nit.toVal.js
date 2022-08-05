test ("nit.toVal () converts a string into a JavaScript value.", () =>
{
    function A () {}

    expect (nit.toVal ("\\a")).toBe ("a");
    expect (nit.toVal ("true")).toBe (true);
    expect (nit.toVal ("false")).toBe (false);
    expect (nit.toVal ("null")).toBe (null);
    expect (nit.toVal ("3")).toBe (3);
    expect (nit.toVal ("{ a: 3 }")).toEqual ({ a: 3 });
    expect (nit.toVal ("[ 1, 2 ]")).toEqual ([1, 2]);

    nit.log = function () {};

    expect (nit.toVal (new A)).toBeInstanceOf (A);
    expect (nit.toVal ("1, 2")).toBe ("1, 2");
    expect (nit.toVal ("a")).toBe ("a");
    expect (nit.toVal ("{ a 3 }")).toBe ("{ a 3 }");
    expect (nit.toVal ("[ a 3 ]")).toBe ("[ a 3 ]");
});

test ("nit.registerClass ()", () =>
{
    function A () {}
    function B () {}

    nit.registerClass ("A", A);
    expect (nit.CLASSES.A).toBe (A);

    nit.registerClass (B);
    expect (nit.CLASSES.B).toBe (B);
});

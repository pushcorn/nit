test ("nit.registerClass ()", () =>
{
    function A () {}
    function B () {}

    nit.registerClass ("A", A);
    expect (nit.CLASSES.A).toBe (A);

    nit.registerClass (B);
    expect (nit.CLASSES.B).toBe (B);
});


test ("nit.registerClass.lazy ()", () =>
{
    function defineClassA ()
    {
        return nit.defineClass ("A");
    }

    nit.registerClass.lazy ("A", defineClassA);

    expect (nit.NS.A).toBeUndefined ();

    nit.lookupClass ("A");
    expect (nit.NS.A).toBeInstanceOf (Function);
});

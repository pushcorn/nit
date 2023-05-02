test ("nit.constructObject ()", () =>
{
    const A = nit.defineClass ("A");

    expect (nit.constructObject (A, {})).toBeInstanceOf (A);
    expect (nit.constructObject (new A)).toBeInstanceOf (A);
});

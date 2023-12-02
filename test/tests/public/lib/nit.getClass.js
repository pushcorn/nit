test ("nit.getClass ()", () =>
{
    let A = nit.defineClass ("test.A");
    let a = new A;

    expect (nit.getClass (a)).toBe (A);
    expect (nit.getClass (A)).toBe (A);
});

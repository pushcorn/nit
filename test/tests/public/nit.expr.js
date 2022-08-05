test ("nit.expr () turns an expression into a function", () =>
{
    let expr = nit.expr ("a * 2");

    expect (expr).toBeInstanceOf (Function);

    expect (() => nit.expr ("?a + 3")).toThrow ();

    let expr2 = nit.expr ("a.b * 2");

    expect (() => expr2 ()).toThrow ();
});

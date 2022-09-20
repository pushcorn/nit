test ("constraints.Type", () =>
{
    const A = nit.defineClass ("A");
    const B = nit.defineClass ("B");
    const C = nit.defineClass ("C");

    const MyObj = nit.defineClass ("MyObj")
        .field ("[obj]", "any")
            .constraint ("type", "A", "B")
    ;

    expect (MyObj (new A).obj).toBeInstanceOf (A);
    expect (MyObj (new B).obj).toBeInstanceOf (B);
    expect (() => MyObj (new C)).toThrow (/the value of.*obj.*should be one of.*/i);
    expect (MyObj (null).obj).toBeUndefined ();
});

test ("constraints.Eval", () =>
{
    let Sum = nit.defineClass ("Sum")
        .field ("<a>", "integer")
        .field ("<b>", "integer")
            .constraint ("eval", "owner.a > 0 && value > 0")
    ;

    expect (() => Sum (0, 0)).toThrow (/failed/);
    expect (Sum (1, 1).toPojo ()).toEqual ({ a: 1, b: 1 });
});

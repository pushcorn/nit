test ("nit.Constraint", () =>
{
    let Max = nit.defineConstraint ("MaxInt")
        .meta ("applicableTypes", "integer")
        .throws ("error.greater_than_max", "The value is greater than %{constraint.max}.")
        .property ("max", "integer", 10)
    ;

    expect (Max.name).toBe ("constraints.MaxInt");
    expect (Max.code).toBe ("error.greater_than_max");
    expect (Max.message).toBe ("The value is greater than %{constraint.max}.");
    expect (Max.applicableTypes).toEqual (["integer"]);

    let cons = new Max;

    expect (() => cons.validate ({})).toThrow (/cannot be applied to.*undefined/i);
    expect (cons.applicableTo ("integer")).toBe (true);
    expect (cons.applicableTo ("string")).toBe (false);
    expect (() => cons.validate ({ value: "10" })).toThrow (/validate.*was not implemented/i);


    Max.onValidate (function (ctx)
    {
        return ctx.value * 1 <= ctx.constraint.max;
    });

    cons = new Max ({ message: "greater than! %{constraint.max}" });

    let ctx = new nit.Constraint.ValidationContext (
    {
        value: 20,
        owner: {},
        property: nit.Field ("age", "integer")
    });

    ctx.value = "aab";
    expect (() => cons.validate (ctx)).toThrow (/cannot be applied to.*aab/i);
    ctx.value = 500;
    expect (() => cons.validate (ctx)).toThrow (/greater than! 10/i);
    ctx.value = 5;
    expect (cons.validate (ctx)).toBe (true);
});

test ("nit.Constraint", () =>
{
    let Max = nit.defineConstraint ("MaxInt")
        .appliesTo ("integer")
        .throws ("error.greater_than_max", "The value is greater than %{constraint.max}.")
        .property ("max", "integer", 10)
    ;

    expect (() => Max.appliesTo ("magic")).toThrow (/constraint value type.*invalid/);
    expect (Max.name).toBe ("constraints.MaxInt");
    expect (Max.defaults ()).toEqual ({ code: "error.greater_than_max", applicableTypes: ["integer"] });

    let cons = new Max;

    expect (() => cons.validate ()).toThrow (/cannot be applied to.*undefined/i);
    expect (cons.applicableTo ("integer")).toBe (true);
    expect (cons.applicableTo ("string")).toBe (false);
    expect (() => cons.validate ("10")).toThrow (/method not implemented/i);


    Max.validate (function (value, ctx)
    {
        return value * 1 <= ctx.constraint.max;
    });

    cons = new Max;

    let ctx = new nit.Constraint.ValidationContext (
    {
        value: 20,
        owner: {},
        property: nit.Field ("age", "integer")
    });

    expect (() => cons.validate ("aab", ctx)).toThrow (/cannot be applied to.*aab/i);
    expect (() => cons.validate (500, ctx)).toThrow (/the value is greater than 10/i);
    expect (cons.validate (5, ctx)).toBe (true);
});

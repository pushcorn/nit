test ("constraints.Min", () =>
{
    let Car = nit.defineClass ("Car")
        .field ("<speed>", "integer")
            .constraint ("min", 0)
    ;

    expect (() => new Car (-1)).toThrow (/minimum value.*is '0'/);
});

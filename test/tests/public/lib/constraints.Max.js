test ("constraints.Max", () =>
{
    let Car = nit.defineClass ("Car")
        .field ("<speed>", "integer")
            .constraint ("max", 200)
    ;

    expect (() => new Car (900)).toThrow (/maximum value.*is '200'/);
});

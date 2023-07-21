test ("constraints.Custom", () =>
{
    let Shirt = nit.defineClass ("Shirt")
        .field ("<size>", "string")
            .constraint ("custom", ctx => ctx.value == "XL")
    ;

    expect (() => new Shirt ("XXL")).toThrow (/the value.*XXL.*is invalid/i);
});

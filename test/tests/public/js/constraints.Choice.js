test ("constraints.Choice", () =>
{
    let Shirt = nit.defineClass ("Shirt")
        .field ("<size>", "string")
            .constraint ("choice", "S", "M", "L", "XL")
    ;

    expect (() => new Shirt ("XXL")).toThrow (/not a valid choice/);

    let Shirt2 = nit.defineClass ("Shirt2")
        .field ("<size>", "string")
            .constraint ("choice",
                nit.object ({ value: "S", text: "SMALL" }),
                nit.object ({ value: "M", text: "MEDIUM" })
            )
    ;

    expect (new Shirt2 ("S")).toBeInstanceOf (Shirt2);
});

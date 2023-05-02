test ("nit.propertyDescriptors () returns the property descriptors of an object", () =>
{
    let obj = { a: 3 };

    nit.dpv (obj, "hidden", "secret", false, false);

    let desc = nit.propertyDescriptors (obj);

    expect (desc).toEqual (
    {
        a:
        {
            configurable: true,
            enumerable: true,
            writable: true,
            value: 3
        }
    });

    let allDesc = nit.propertyDescriptors (obj, true);

    expect (allDesc.hidden).toEqual (
    {
        configurable: false,
        enumerable: false,
        writable: false,
        value: "secret"
    });
});

test ("nit.typedArgsToObj () combines typed args into an object.", () =>
{
    function method () {}

    expect (nit.typedArgsToObj ([method, false], { m: "function", b: "boolean" }))
        .toEqual ({ m: method, b: false });

    expect (nit.typedArgsToObj ([method, false, { c: 9 }], { m: "function", b: "boolean" }))
        .toEqual ({ m: method, b: false, c: 9 });

    expect (nit.typedArgsToObj (["my.method", method], { n: "string", m: "function", b: "boolean" }))
        .toEqual ({ n: "my.method", m: method });

    expect (nit.typedArgsToObj (["str1", "str2", "str3"], { n: "string", m: "string", z: "boolean" }))
        .toEqual ({ n: "str1", m: "str2" });

});

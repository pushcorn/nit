test ("nit.serialize () converts the input to a string.", () =>
{
    expect (nit.serialize (3)).toBe ("3");
    expect (nit.serialize (false)).toBe ("false");
    expect (nit.serialize (null)).toBe ("");
    expect (nit.serialize (undefined)).toBe ("");
    expect (nit.serialize (Buffer.from ("STRING"))).toBe ("STRING");
    expect (nit.serialize (Symbol ("S"))).toBe ("Symbol(S)");
    expect (nit.serialize ({ a: 3 })).toBe ('{"a":3}');
    expect (nit.serialize ({ a: 3 }, true)).toBe (
`{
    "a": 3
}`);
});

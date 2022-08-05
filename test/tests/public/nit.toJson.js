test ("nit.toJson () returns the JSON string of the input.", () =>
{
    function A () {}

    expect (nit.toJson ({ b: 4 })).toBe ('{"b":4}');
    expect (nit.toJson ()).toBeUndefined ();
    expect (nit.toJson (null)).toBe ("null");

    expect (nit.toJson ({ a: 3 }, 0)).toBe ('{"a":3}');
    expect (nit.toJson ({ a: 3 }, false)).toBe ('{"a":3}');
    expect (nit.toJson ({ a: 3 }, A)).toBe ('{"a":3}');

    expect (nit.toJson ({ a: 3 }, true)).toBe (
`{
    "a": 3
}`);

    expect (nit.toJson (A, "  ")).toBe (
`{
  "name": "A"
}`);

    let arr = [3, 4];
    {
        arr.prop = "prop";

        expect (nit.toJson (arr)).toBe ("[3,4]");
    }
});


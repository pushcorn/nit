test ("nit.uriEncode ()", () =>
{
    expect (nit.uriEncode ()).toBe ("");
    expect (nit.uriEncode (null, "k")).toBe ("k=");
    expect (nit.uriEncode ({ a: 99 })).toBe ("a=99");
    expect (nit.uriEncode ({ a: [3, 4, 5]})).toBe ("a[0]=3&a[1]=4&a[2]=5");
    expect (nit.uriEncode ("this is a string")).toBe ("this%20is%20a%20string");
    expect (nit.uriEncode ([5, 6, 7], "arr")).toBe ("arr[0]=5&arr[1]=6&arr[2]=7");
    expect (nit.uriEncode ({ a: "a str", b: 20, c: { d: "val", e: [9, 10, 11] } }))
        .toBe ("a=a%20str&b=20&c[d]=val&c[e][0]=9&c[e][1]=10&c[e][2]=11");
});

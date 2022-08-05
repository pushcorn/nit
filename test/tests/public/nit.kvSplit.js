test ("nit.kvSplit () splits a string into a key-value pair", () =>
{
    expect (nit.kvSplit ("a=b", "=")).toEqual (["a", "b"]);
    expect (nit.kvSplit ("a.b.c", ".", true)).toEqual (["a.b", "c"]);
    expect (nit.kvSplit ("a b c")).toEqual (["a", "b c"]);
    expect (nit.kvSplit ("key")).toEqual (["key"]);
    expect (nit.kvSplit ("value", null, true)).toEqual (["", "value"]);
});

test ("nit.flip () flips the the keys and values of an object.", () =>
{
    expect (nit.flip ({ a: 1, b: 2 })).toEqual ({ 1: "a", 2: "b" });
});

test ("nit.freeze () freeze an object recursively.", function ()
{
    expect (nit.freeze ({}).b).toBeUndefined ();

    let obj;

    nit.freeze (obj = { a: 3 });
    obj.a = 4;
    expect (obj.a).toBe (3);

    nit.freeze (obj = { a: [5, 6] });
    expect (() => obj.a.push (6)).toThrow (/not extensible/);

    nit.freeze (obj = { a: { b: 9 } });
    obj.a.b = 4;
    expect (obj.a.b).toBe (9);
});

test ("nit.copyProperties ()", () =>
{
    const { Writable } = require ("stream");

    nit.registerClass ("Writable", Writable);

    const MyStream = nit.defineClass ("MyStream")
        .extend (Writable)
    ;

    expect (nit.is.subclassOf (MyStream, nit.Class)).toBe (false);
    expect (nit.is.subclassOf (MyStream, Writable)).toBe (true);
    expect (MyStream.method).toBe (undefined);
    expect (MyStream.prototype.throw).toBe (undefined);

    nit.copyProperties (nit.Class, MyStream);
    expect (MyStream.method).toBeInstanceOf (Function);

    nit.copyProperties (nit.Class.prototype, MyStream.prototype);
    expect (MyStream.prototype.throw).toBeInstanceOf (Function);
});

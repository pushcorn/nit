test ("nit.mix ()", () =>
{
    const { Writable } = require ("stream");

    nit.registerClass ("Writable", Writable);

    const MyStream = nit.defineClass ("MyStream")
        .extend (Writable)
    ;

    expect (nit.mix (MyStream, nit.Class)).toBe (MyStream);
    expect (MyStream.method).toBeInstanceOf (Function);
    expect (MyStream.prototype.throw).toBeInstanceOf (Function);
});

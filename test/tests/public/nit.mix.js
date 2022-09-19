test ("nit.mix ()", () =>
{
    const { Writable } = require ("stream");

    nit.registerClass ("Writable", Writable);

    const MyStream = nit.defineClass ("MyStream")
        .extend (Writable)
    ;

    nit.mix (MyStream, nit.Class);
    expect (MyStream.method).toBeInstanceOf (Function);
    expect (MyStream.prototype.throw).toBeInstanceOf (Function);
});

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


    function aa () {}

    const A = nit.defineClass ("A")
        .method ("aa", function () {})
        .method ("cc", function () {})
    ;

    const B = nit.defineClass ("B")
        .method ("bb", function () {})
        .method ("aa", aa)
    ;

    nit.copyProperties (A.prototype, B.prototype, ["aa"]);
    expect (B.prototype.aa).toBe (aa);
    expect (B.prototype.cc).toBe (A.prototype.cc);

    nit.copyProperties (A.prototype, B.prototype, null, true);
    expect (B.prototype.aa).toBe (A.prototype.aa);
});

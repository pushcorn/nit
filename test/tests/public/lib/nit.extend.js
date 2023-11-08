test ("nit.extend () makes a subclass a child class of a superclass", () =>
{
    function Sub () {}

    Sub.prototype.a = 3;
    Sub.prototype.b = 4;

    function Super () {}

    Super.prototype.b = 5;
    Super.prototype.c = 6;

    nit.extend (Sub, Super);

    expect (new Sub).toBeInstanceOf (Super);
    expect (nit.keys (Sub.prototype)).toEqual (["c", "a", "b"]);
});

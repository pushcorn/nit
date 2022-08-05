test ("nit.extend () makes a subclass a child class of a superclass", () =>
{
    function Sub () {}
    function Super () {}

    nit.extend (Sub, Super);

    expect (new Sub).toBeInstanceOf (Super);
});

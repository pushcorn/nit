test ("nit.getSuperclass () returns the superclass of a class", () =>
{
    function Sub () {}
    function Super () {}

    nit.extend (Sub, Super);

    expect (nit.getSuperclass (Sub)).toBe (Super);
    expect (nit.getSuperclass (Super)).toBeUndefined ();
});

test ("nit.createFunction () returns a function with the specified name and body", () =>
{
    let addOne = nit.createFunction ("addOne", "return a + 1", ["a"]);

    expect (addOne).toBeInstanceOf (Function);
    expect (addOne.name).toBe ("addOne");
    expect (addOne (3)).toBe (4);

    let noop = nit.createFunction ("noop");

    expect (noop.name).toBe ("noop");
});

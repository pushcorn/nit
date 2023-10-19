test ("nit.categoryName ()", () =>
{
    const MyComp = nit.defineClass ("test.MyComp");

    expect (nit.categoryName (MyComp)).toBe ("mycomps");
    expect (nit.categoryName (MyComp.name)).toBe ("mycomps");
    expect (nit.categoryName (MyComp.simpleName)).toBe ("mycomps");
});

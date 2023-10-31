test ("nit.k () generates a namespaced key", () =>
{
    function MyClass () {}

    nit.k (MyClass, "prop-name");
    nit.k (MyClass, "$", "myProp");

    expect (MyClass.kPropName).toBe ("MyClass.propName");
    expect (MyClass.kMyProp).toBe ("MyClass$myProp");
});

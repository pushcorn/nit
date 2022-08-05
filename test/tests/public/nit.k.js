test ("nit.k () generates a namespaced key", () =>
{
    function MyClass () {}

    nit.k (MyClass, "prop-name");

    expect (MyClass.kPropName).toBe ("MyClass.propName");
});

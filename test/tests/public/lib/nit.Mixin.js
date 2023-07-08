test ("nit.Mixin", async () =>
{
    const MyMix = nit.defineMixin ("MyMix")
        .excludeStaticProperties ("privateStaticMethod")
        .excludeProperties ("privateMethod")
        .staticMethod ("myStaticMethod", () => {})
        .staticMethod ("privateStaticMethod", () => {})
        .method ("myMethod", () => {})
        .method ("privateMethod", () => {})
        .onMix (() =>
        {
            MyMix.onMixCalled = true;
        })
    ;

    const A = nit.defineClass ("A")
        .mixin (MyMix)
    ;

    expect (A.myStaticMethod).toBeInstanceOf (Function);
    expect (A.prototype.myMethod).toBeInstanceOf (Function);
    expect (A.privateStaticMethod).toBeUndefined ();
    expect (A.prototype.privateMethod).toBeUndefined ();
    expect (MyMix.onMixCalled).toBe (true);
    expect (MyMix.excludedStaticProperties).toEqual (["privateStaticMethod"]);
    expect (MyMix.excludedProperties).toEqual (["privateMethod"]);
});

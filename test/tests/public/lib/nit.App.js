test ("nit.App", () =>
{
    const PropConfigurator = nit.defineClassConfigurator ("PropConfigurator")
        .staticProperty ("timesCalled", "integer")
        .field ("<prop>", "string")
        .field ("<value>", "any")
        .onConfigure (function (cls)
        {
            ++PropConfigurator.timesCalled;

            cls[this.prop] = this.value;
        })
    ;

    nit.defineClass ("test.classes.User")
        .staticProperty ("flag", "string")
    ;

    let pc = new PropConfigurator ("test.classes.*", "flag", "abc");

    let app = new nit.App (pc);

    app.init ();

    let User = nit.lookupClass ("test.classes.User");

    expect (User.flag).toBe ("abc");
    expect (app.configured["test.classes.User"]).toBe (true);

    nit.lookupClass ("test.classes.User");
    expect (PropConfigurator.timesCalled).toBe (1);
});

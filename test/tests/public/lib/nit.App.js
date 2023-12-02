test ("nit.App", () =>
{
    const PropConfigurator = nit.defineClassConfigurator ("PropConfigurator")
        .field ("<prop>", "string")
        .field ("<value>", "any")
        .onConfigure (function (cls)
        {
            cls[this.prop] = this.value;
        })
    ;

    let User = nit.defineClass ("test.classes.User")
        .staticProperty ("flag", "string")
    ;

    let pc = new PropConfigurator ("test.classes.*", "flag", "abc");

    let app = new nit.App (pc);

    app.configure (User);
    expect (User.flag).toBe ("abc");
});

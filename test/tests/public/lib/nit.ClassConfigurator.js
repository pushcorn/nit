test ("nit.ClassConfigurator", () =>
{
    const PropConfigurator = nit.defineClassConfigurator ("PropConfigurator")
        .field ("<prop>", "string")
        .field ("<value>", "any")
    ;

    const User = nit.defineClass ("test.classes.User")
        .staticProperty ("flag", "string")
    ;

    let pc = new PropConfigurator ("test.classes.*", "flag", "abc");

    expect (pc.classPatterns.every (p => p instanceof RegExp)).toBe (true);
    expect (() => pc.configure (User)).toThrow (/lifecycle.*not implemented/);

    PropConfigurator.onConfigure (function (cls)
    {
        cls[this.prop] = this.value;
    });

    expect (pc.configure (User).flag).toBe ("abc");
    expect (pc.configure (nit.Object).flag).toBeUndefined ();
});

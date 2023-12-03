test ("nit.test.strategies.Plugin", async () =>
{
    const nit = await test.reloadNit ();

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.Plugin");

    const MyPlugin = nit.definePlugin ("MyPlugin")
        .field ("<base>", "integer")
        .onRegisteredBy (function (hostClass)
        {
            hostClass.pluginRegistered = true;
        })
        .onUsedBy (function (hostClass)
        {
            let plugin = this;

            hostClass
                .staticMethod ("addOne", function (v)
                {
                    return v + 1 + plugin.base;
                })
                .method ("addTwo", function (v)
                {
                    return v + 2 + plugin.base;
                })
            ;
        })
    ;


    let st = new nit.test.strategies.Plugin ("plugins.MyPlugin", "addOne", true, { pluginArgs: 2 });
    expect (st.description).toBe ("Plugin: plugins.MyPlugin => Host.addOne ()");
    await st.testInit ();
    await st.testUp ();
    expect (st.test (3)).toBe (6);

    st = new nit.test.strategies.Plugin ("plugins.MyPlugin", "addTwo", { pluginArgs: 1 });
    await st.testInit ();
    await st.testUp ();
    expect (st.test (3)).toBe (6);

    let MyHost = nit.defineClass ("test.MyHost");

    st = new nit.test.strategies.Plugin (MyPlugin, "addTwo", { pluginArgs: 2, hostClass: MyHost });
    await st.testInit ();
    await st.testUp ();
    expect (st.test (3)).toBe (7);

    MyHost = nit.defineClass ("test.MyHost");
    st = new nit.test.strategies.Plugin (MyPlugin, "addTwo", { pluginArgs: 2, registerPlugin: true, hostClass: MyHost });
    await st.testInit ();
    await st.testUp ();
    expect (st.test (3)).toBe (7);
    expect (MyHost.pluginRegistered).toBe (true);
});

test ("nit.test.strategies.CompgenCompleter", async () =>
{
    const nit = await test.reloadNit ("project-a");

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.CompgenCompleter");

    let st = new nit.test.strategies.CompgenCompleter ("nit.compgencompleters.Demo");

    const Cmd = nit.defineCommand ("Cmd")
        .defineInput (Input =>
        {
            Input.option ("fld", "demo");
        })
    ;

    await st.testUp ({ completionType: "type", currentOption: Cmd.Input.fieldMap.fld });

    expect (st.description).toMatch (/Compgen Completer.*Demo/);
    expect (st.class).toBe (nit.NS.nit.compgencompleters.Demo);
    expect (await st.test ()).toEqual (["VALUE", "demo1", "demo2"]);
});

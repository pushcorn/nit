test ("nit.test.strategies.Command", async () =>
{
    const nit = await test.reloadNit ("project-a");

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.Command");

    let st = new nit.test.strategies.Command ("commands.TestCmd");
    expect (st.description).toMatch (/Command.*TestCmd/);
    expect (st.commandClass).toBe (nit.NS.commands.TestCmd);
    expect (await st.test ()).toBe ("This is the test command.");
});

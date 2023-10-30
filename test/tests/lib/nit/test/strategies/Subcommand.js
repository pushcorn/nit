test ("nit.test.strategies.Subcommand", async () =>
{
    const nit = await test.reloadNit ("project-a");

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.Subcommand");

    let st = new nit.test.strategies.Subcommand ("commands.Git", "pull");

    expect (nit.CLASSES["gitsubcommands.Pull"]).toBeUndefined ();

    await st.testUp ();

    expect (nit.CLASSES["gitsubcommands.Pull"]).toBeInstanceOf (Function);
    expect (st.description).toMatch (/git subcommand.*pull/i);
    expect (st.class).toBe (nit.NS.commands.Git);
    expect (await st.test ()).toBe ("pull completed");
});

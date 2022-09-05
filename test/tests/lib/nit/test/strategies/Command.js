test ("nit.test.strategies.Command", async () =>
{
    const nit = await test.reloadNit ("project-a");

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.Command");

    let st = new nit.test.strategies.Command ("commands.TestCmd");

    await st.testUp ();

    expect (st.description).toMatch (/Command.*TestCmd/);
    expect (st.class).toBe (nit.NS.commands.TestCmd);
    expect (await st.test ()).toBe ("This is the test command.");


    st.class.Input
        .option ("arg", "string")
    ;

    await st.testUp (["--arg", "value"]);

    st.class
        .method ("run", function ()
        {
            throw new Error ("CMD_ERROR");
        })
    ;

    expect (() => st.test ()).rejects.toThrow ("CMD_ERROR");
});

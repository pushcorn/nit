test ("nit.test.strategies.Workflow", async () =>
{
    const nit = await test.reloadNit ("project-a");

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.Workflow");

    let st = new nit.test.strategies.Workflow ("nit:echo-test");
    let mock = test.mock (nit, "log", function () {}, 2);

    await st.testUp ({ input: { colorize: true  } });

    expect (await st.test ()).toBe ("test 2 true");
    expect (mock.invocations[0].args).toEqual (["test 1"]);
    expect (mock.invocations[1].args[0]).toMatch (/^\d{4}.*test 2 true/);

    expect (() => new nit.test.strategies.Workflow ("nit:echo-test2")).toThrow (/not found/);

    st = new nit.test.strategies.Workflow ("nit:log-message");
    await st.testUp ();
    expect (st.object.description).toBe ("Log Message");
});

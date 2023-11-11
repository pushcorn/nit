test ("nit.test.strategies.WorkflowStep", async () =>
{
    const nit = await test.reloadNit ("project-a");

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.WorkflowStep");

    let st = new nit.test.strategies.WorkflowStep ("nit:echo-test");
    let mock = test.mock (nit, "log", function () {});

    await st.testUp ("mesg: %{input}");

    st.context = { input: "hello" };

    expect ((await st.test ()).output).toBe ("hello");
    expect (mock.invocations[0].args).toEqual (["mesg: hello"]);
});

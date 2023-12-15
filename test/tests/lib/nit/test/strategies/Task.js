test ("nit.test.strategies.Task", async () =>
{
    const nit = await test.reloadNit ("project-a");

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.Task");

    let st = new nit.test.strategies.Task ("nit:say-hello");

    await st.testUp ("there");

    expect (await st.test ()).toBe ("Hello there!");
});

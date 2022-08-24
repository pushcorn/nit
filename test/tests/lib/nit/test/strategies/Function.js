test ("nit.test.strategies.Function", async () =>
{
    const nit = await test.reloadNit ();

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.Function");

    function addOne (value)
    {
        return value + 1;
    }

    let st = new nit.test.strategies.Function (addOne);
    expect (st.description).toMatch (/Function.*addOne/);
    expect (st.test (3)).toBe (4);
});

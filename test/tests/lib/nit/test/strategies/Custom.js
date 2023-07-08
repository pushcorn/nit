test ("nit.test.strategies.Custom", async () =>
{
    const nit = await test.reloadNit ();

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.Custom");

    const A = nit.defineClass ("A")
        .staticProperty ("nextId", "integer", 1)
        .onConstruct (function ()
        {
            this.id = A.nextId++;
        })
        .method ("addOne", function (val)
        {
            return val + 1;
        })
    ;

    let st = new nit.test.strategies.Custom ("testing addOne")
        .task (function ()
        {
            return 123;
        })
    ;

    expect (st.description).toMatch ("testing addOne");
    expect (await st.test (st.inputs[0][0])).toBe (123);
});

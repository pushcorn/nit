test ("nit.test.strategies.Method", async () =>
{
    const nit = await test.reloadNit ();

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.Method");

    const A = nit.defineClass ("A")
        .staticMethod ("addTwo", function (value)
        {
            return value + 2;
        })
        .method ("addOne", function (value)
        {
            this.called = (this.called || 0) + 1;

            return value + 1;
        })
    ;

    let st = new nit.test.strategies.Method (new A, "addOne");
    expect (st.description).toMatch (/Method.*A\.addOne/);
    st.up ();
    expect (st.test (3)).toBe (4);

    st = new nit.test.strategies.Method (A, "addTwo", true);
    st.up ();
    expect (st.test (3)).toBe (5);

    st = new nit.test.strategies.Method ("A", "addTwo", true);
    st.up ();
    expect (st.test (3)).toBe (5);

    st = new nit.test.strategies.Method ("A", "addOne");
    st.up ();
    expect (st.test (5)).toBe (6);
    expect (st.object.called).toBe (1);
    st.up ();
    expect (st.test (5)).toBe (6);
    expect (st.object.called).toBe (1);
});

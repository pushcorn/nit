test ("nit.test.strategies.Object", async () =>
{
    const nit = await test.reloadNit ();

    nit.requireAll ("nit.test.Strategy", "nit.test.strategies.Object");

    const A = nit.defineClass ("A")
        .staticProperty ("nextId", "integer", 1)
        .construct (function ()
        {
            this.id = A.nextId++;
        })
        .method ("addOne", function (val)
        {
            return val + 1;
        })
    ;

    let a = new A;
    let obj;

    let st = new nit.test.strategies.Object (A);
    expect (st.description).toMatch ("Object: A");
    expect (st.class).toBe (A);
    expect (obj = await st.test ()).not.toBe (a);
    expect (obj.nextId).toBe (2);

    st = new nit.test.strategies.Object ("A");
    expect (st.description).toMatch ("Object: A");
    expect (st.class).toBe (A);
    expect (obj = await st.test ()).not.toBe (a);
    expect (obj.id).toBe (2);

    st = new nit.test.strategies.Object (a);
    expect (st.description).toMatch ("Object: A");
    expect (st.class).toBe (A);
    expect (obj = await st.test ()).toBe (a);
    expect (obj.id).toBe (1);
});

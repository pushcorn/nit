test ("nit.memoize () returns the same value after the initial invocation", async () =>
{
    function callback ()
    {
        ++callback.count;

        return 100;
    }

    callback.count = 0;

    let memo = nit.memoize (callback);

    expect (memo).toBeInstanceOf (Function);
    expect (memo ()).toBe (100);
    expect (memo ()).toBe (100);
    expect (callback.count).toBe (1);

    function pfunc ()
    {
        return Promise.resolve (10);
    }

    let pval = nit.memoize (pfunc);

    expect (pval ()).toBeInstanceOf (Promise);

    await nit.sleep (10);
    expect (pval ()).toBe (10);
});


test ("nit.memoize.dpg () defines a memoized getter on the target object", async () =>
{
    let cnt = 1;

    function g ()
    {
        return cnt++;
    }

    function p ()
    {
        return Promise.resolve (100);
    }

    let obj = {};

    nit.memoize.dpg (obj, "val", g, false, true);

    let props = nit.propertyDescriptors (obj);

    expect (props.val.configurable).toBe (false);
    expect (props.val.enumerable).toBe (true);
    expect (obj.val).toBe (1);
    expect (obj.val).toBe (1);

    nit.memoize.dpg (obj, "cnt", g);
    expect (obj.cnt).toBe (2);
    expect (obj.cnt).toBe (2);

    nit.memoize.dpg (obj, "num", p);
    expect (obj.num).toBeInstanceOf (Promise);

    await nit.sleep (10);
    expect (obj.num).toBe (100);
});

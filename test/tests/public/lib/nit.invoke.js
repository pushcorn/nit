test ("nit.invoke ()", async () =>
{
    function add (a, b)
    {
        return a + b;
    }

    function inc (field)
    {
        return ++this[field];
    }

    let obj = { cnt: 9 };

    expect (nit.invoke (add, [1, 2])).toBe (3);
    expect (nit.invoke (add)).toBe (NaN);
    expect (nit.invoke ([obj, inc], "cnt")).toBe (10);

    obj.inc = inc;
    expect (nit.invoke ([obj, "inc"], "cnt")).toBe (11);

    obj.incLater = async function (field)
    {
        return (this[field] += 2);
    };

    expect (nit.invoke ([obj, "incLater"], "cnt")).toBeInstanceOf (Promise);
    await nit.sleep (10);
    expect (obj.cnt).toBe (13);

    obj.getVal = function (field)
    {
        return this[field];
    };

    obj.getValLater = async function (field)
    {
        return this[field];
    };

    expect (nit.invoke ([obj, "getVal"], "cnt")).toBe (13);
    expect (nit.invoke ([obj, "getVal"], "name")).toBeUndefined ();
    expect (nit.invoke ([obj, "getVal"], "name", "obj")).toBe ("obj");

    expect (nit.invoke ([obj, "getValLater"], "name", "obj2")).toBeInstanceOf (Promise);
    expect (await nit.invoke ([obj, "getValLater"], "name", "obj3")).toBe ("obj3");

    expect (nit.invoke ([obj, "getVal2"])).toBeUndefined ();
    expect (nit.invoke (null, null, 100)).toBe (100);
});


test ("nit.invoke.then ()", async () =>
{
    function cb (e, res)
    {
        cb.args = { e: e?.message, res };
    }

    nit.invoke.then (function () { throw new Error ("err"); }, null, cb);
    expect (cb.args).toEqual ({ e: "err" });

    nit.invoke.then (function () { return 1; }, null, cb);
    expect (cb.args).toEqual ({ res: 1 });
});


test ("nit.invoke.safe ()", async () =>
{
    function onError (e)
    {
        onError.e = e;
    }

    expect (nit.invoke.safe (function () { throw new Error ("err"); }, null, onError)).toBeUndefined ();
    expect (onError.e).toBeInstanceOf (Error);
    expect (nit.invoke.safe (function () { return 1; })).toBe (1);
    onError.e = null;
    expect (await nit.invoke.safe (function () { return Promise.reject (new Error ("err")); }, null, onError)).toBeUndefined ();
    expect (onError.e).toBeInstanceOf (Error);
    expect (await nit.invoke.safe (function () { return Promise.resolve ("res"); })).toBe ("res");
    expect (await nit.invoke.safe (async function () { await nit.sleep (10); return 5; })).toBe (5);
});


test ("nit.invoke.silent ()", async () =>
{
    expect (nit.invoke.silent (function () { throw new Error ("err"); })).toBeUndefined ();
    expect (nit.invoke.silent (function () { return 1; })).toBeUndefined ();
    expect (await nit.invoke.silent (function () { return Promise.reject (new Error ("err")); })).toBeUndefined ();
    expect (await nit.invoke.silent (function () { return Promise.resolve ("res"); })).toBeUndefined ();
    expect (await nit.invoke.silent (async function () { await nit.sleep (10); return 5; })).toBeUndefined ();
});


test ("nit.invoke.return ()", async () =>
{
    expect (() => nit.invoke.return (function () { throw new Error ("err"); }, 5)).toThrow ("err");
    expect (nit.invoke.return (function () { return 1; }, null, 10)).toBe (10);
});


test ("nit.invoke.chain ()", async () =>
{
    function addOne (v) { return v + 1; }
    function addTwo (v) { return v + 2; }

    let a;
    expect (nit.invoke.chain (a = [addOne, addTwo], 5)).toBe (7);
    expect (nit.invoke.chain (a = [addOne, addTwo], 5, 100)).toBe (100);
    expect (a).toEqual ([addOne, addTwo]);

    async function addOneAsync (v) { await nit.sleep (10); return v + 1; }
    async function addTwoAsync (v) { await nit.sleep (20); return v + 3; }

    let o = {};
    expect (await nit.invoke.chain ([addOneAsync, addTwoAsync], 5)).toBe (8);
    expect (await nit.invoke.chain ([[o, addOneAsync], [o, addTwoAsync]], 5)).toBe (8);
    expect (await nit.invoke.chain ([[o, addOneAsync], [o, addTwoAsync]], 5, 20)).toBe (20);
});


test ("nit.invoke.each ()", async () =>
{
    function addOne (v) { return v + 1; }

    expect (nit.invoke.each ([3, 4], addOne)).toBe (5);
    expect (nit.invoke.each ([3, 4], addOne, 10)).toBe (10);

    async function addOneAsync (v) { await nit.sleep (10); return v + 1; }

    expect (await nit.invoke.each ([5, 6], addOneAsync)).toBe (7);
    expect (await nit.invoke.each ([5, 6], addOneAsync, 100)).toBe (100);
});


test ("nit.invoke.after ()", async () =>
{
    function addOne (v) { return v + 1; }

    function after ()
    {
        return 9;
    }

    expect (nit.invoke.after (addOne, 3, after)).toBe (9);

    async function addOneAsync (v) { await nit.sleep (10); return v + 1; }
    async function addOneAsyncErr () { await nit.sleep (10); nit.throw ("ERR"); }

    expect (await nit.invoke.after (addOneAsync, 6, after)).toBe (9);
    expect (await nit.invoke.after (addOneAsync, 6, nit.noop)).toBe (7);

    function afterErr ()
    {
        afterErr.called = true;
    }

    await expect (nit.invoke.after (addOneAsyncErr, 6, afterErr)).rejects.toThrow ("ERR");
    expect (afterErr.called).toBe (true);
});


test ("nit.invoke.wrap ()", async () =>
{
    async function addOne (v) { return v + 1; }

    let f = nit.invoke.wrap (addOne, async (next, v) => (await next (v)) * 10);
    expect (await f (3)).toBe (40);

    async function throwErr (v) { nit.throw ("ERR" + v); }

    let g = nit.invoke.wrap (throwErr, function (next, v)
    {
        return next (v);
    });

    await expect (() => g (3)).rejects.toThrow ("ERR3");

    const A = nit.defineClass ("A");

    A.staticLifecycleMethod ("addOne", null, v => v + 1)
        .onAddOne ("wrap", (next, v) => next (v) * 10)
    ;

    expect (A.addOne (3)).toBe (40);
});


test ("nit.invoke.wrap.after ()", async () =>
{
    function after (e, v, ov)
    {
        after.ov = ov;
        return v * 10;
    }

    function addOne (v) { return v + 1; }
    function addOneErr () { nit.throw ("ERR"); }

    let f = nit.invoke.wrap.after (addOne, after);
    expect (f (3)).toBe (40);
    expect (after.ov).toBe (3);

    let g = nit.invoke.wrap.after (addOneErr, after);
    expect (() => g (10)).toThrow ("ERR");
    expect (after.ov).toBe (10);
});


test ("nit.invoke.wrap.before ()", async () =>
{
    function before (args) { args[1] = 10; }
    function multiply (a, b) { return a * b; }
    async function multiplyAsync (a, b) { await nit.sleep (10); return a * b; }
    function multiplyErr () { nit.throw ("ERR"); }

    let f = nit.invoke.wrap.before (multiply, before);
    expect (f (3, 4)).toBe (30);

    f = nit.invoke.wrap.before (multiplyAsync, before);
    expect (await f (4, 5)).toBe (40);

    let g = nit.invoke.wrap.after (multiplyErr, before);
    expect (() => g (3, 4)).toThrow ("ERR");
});

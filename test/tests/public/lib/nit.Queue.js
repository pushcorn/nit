test ("nit.Queue", async () =>
{
    let queue = nit.Queue ({ a: "b" })
        .push (function (ctx)
        {
            expect (ctx.result).toEqual ({ a: "b" });
            expect (ctx.seq).toBe (1);
        })
        .lpush (function (ctx)
        {
            ctx.seq = 1;
        })
        .push (function (ctx)
        {
            ctx.seq = 2;
        })
        .post (function (ctx)
        {
            ctx.postCalled = true;
        })
        .lpost (function (ctx)
        {
            ctx.lpostCalledBeforePost = ctx.postCalled === undefined;
        })
    ;

    queue.pop ();
    queue.lpush (function (ctx)
        {
            ctx.seq = 3;
        })
        .lpop ()
    ;

    await queue
        .push (async function (ctx)
        {
            await nit.sleep (10);
            ctx.asyncCalled = true;

            return "done";
        })
        .run (function (ctx)
        {
            expect (ctx.seq).toBe (1);
            expect (ctx.asyncCalled).toBe (true);
            expect (ctx.result).toBe ("done");
            expect (ctx.postCalled).toBe (true);
            expect (ctx.lpostCalledBeforePost).toBe (true);
        })
    ;


    await nit.Queue ({ val: 3 })
        .push (async function (ctx)
        {
            ctx.result = ctx.result.val;
        })
        .run (function (ctx)
        {
            expect (ctx.result).toBe (3);
        })
    ;

    await nit.Queue ({ val: 9 })
        .push (async function (ctx)
        {
            ctx.result = ctx.result.val;
        })
        .run (function (ctx)
        {
            expect (ctx.result).toBe (9);
        })
    ;
});


test ("nit.Queue - invoke run before completion", async () =>
{
    let queue = nit.Queue ();
    let jobs = [];

    queue.push (async function ()
    {
        await nit.sleep (10);
        jobs.push (1);
    });

    queue.push (async function ()
    {
        await nit.sleep (20);
        jobs.push (2);
    });

    let p = queue.run (async function ()
    {
        await nit.sleep (5);
        jobs.push (3);
    });

    queue.push (async function ()
    {
        await nit.sleep (2);
        jobs.push (4);
    });

    queue.run (function ()
    {
        jobs.push (5);
    });

    expect (jobs).toEqual ([]);
    await p;
    expect (jobs).toEqual ([1, 2, 4, 5]);
});


test ("nit.Queue.success ()", async () =>
{
    let outputs = [];
    let result = await nit.Queue ()
        .push (function ()
        {
            outputs.push (1);
        })
        .push (function ()
        {
            outputs.push (2);
        })
        .push (async function ()
        {
            await nit.sleep (10);
            outputs.push (3);
            return 100;
        })
        .success (function ()
        {
            outputs.push ("succ");
        })
        .complete (function ()
        {
            outputs.push ("comp");
        })
        .run ()
    ;

    expect (outputs).toEqual ([1, 2, 3, "succ", "comp"]);
    expect (result).toBe (100);
});


test ("nit.Queue.run (ctx)", async () =>
{
    let ctx = { seq: 1 };

    let outputs = [];
    let result = await nit.Queue ()
        .push (function ()
        {
            outputs.push (1);
        })
        .push (function ()
        {
            outputs.push (2);
        })
        .push (async function ()
        {
            await nit.sleep (10);
            outputs.push (3);
            return 100;
        })
        .run (function (ctx)
        {
            ++ctx.seq;
            outputs.push ("succ");
            return 1000;

        }, ctx)
    ;

    expect (outputs).toEqual ([1, 2, 3, "succ"]);
    expect (result).toBe (1000);
    expect (ctx.seq).toBe (2);
});


test ("nit.Queue.failure ()", async () =>
{
    let ctx = {};
    let outputs = [];
    let result;
    let uncaughtError;
    let q = nit.Queue ();

    try
    {
        result = await q
            .pre (function ()
            {
                ctx.preCalled = true;
            })
            .lpre (function ()
            {
                ctx.lpreCalledBeforePre = ctx.preCalled === undefined;
            })
            .push (function ()
            {
                outputs.push (1);
            })
            .push (function ()
            {
                outputs.push (2);
            })
            .push (async function ()
            {
                await nit.sleep (10);
                outputs.push (3);
                nit.throw ("failed");
            })
            .push (function ()
            {
                ctx.notCalled = true;
            })
            .post (function ()
            {
                ctx.postNotCalled = true;
            })
            .failure (async function ()
            {
                outputs.push ("err handled");
                nit.throw ("failed again");
            })
            .complete (function ()
            {
                ctx.completeCalled = true;
            })
            .run (ctx)
        ;
    }
    catch (e)
    {
        uncaughtError = e;
    }

    expect (outputs).toEqual ([1, 2, 3, "err handled"]);
    expect (result).toBeUndefined ();
    expect (ctx.lpreCalledBeforePre).toBe (true);
    expect (ctx.preCalled).toBe (true);
    expect (ctx.notCalled).toBeUndefined ();
    expect (ctx.postNotCalled).toBeUndefined ();
    expect (q.tasks.length).toBe (1);
    expect (q.preTasks.length).toBe (0);
    expect (q.postTasks.length).toBe (1);
    expect (uncaughtError).toBeInstanceOf (Error);
    expect (uncaughtError.message).toBe ("failed again");
});


test ("nit.Queue - throws asynchronously without onFailure", async () =>
{
    let ctx = {};
    let outputs = [];
    let result;
    let uncaughtError;

    try
    {
        result = await nit.Queue ()
            .push (function ()
            {
                outputs.push (1);
            })
            .push (function ()
            {
                outputs.push (2);
            })
            .push (async function ()
            {
                await nit.sleep (10);
                outputs.push (3);
                nit.throw ("failed");
            })
            .run (ctx)
        ;
    }
    catch (e)
    {
        uncaughtError = e;
    }

    expect (outputs).toEqual ([1, 2, 3]);
    expect (result).toBeUndefined ();
    expect (uncaughtError).toBeInstanceOf (Error);
    expect (uncaughtError.message).toBe ("failed");
});


test ("nit.Queue - throws synchronously without onFailure", () =>
{
    let ctx = {};
    let outputs = [];
    let result;
    let uncaughtError;

    try
    {
        result = nit.Queue ()
            .push (function ()
            {
                outputs.push (1);
            })
            .push (function ()
            {
                outputs.push (2);
            })
            .push (function ()
            {
                outputs.push (3);
                nit.throw ("failed");
            })
            .complete (function (ctx)
            {
                ctx.completed = true;
            })
            .run (ctx)
        ;
    }
    catch (e)
    {
        uncaughtError = e;
    }

    expect (outputs).toEqual ([1, 2, 3]);
    expect (result).toBeUndefined ();
    expect (uncaughtError).toBeInstanceOf (Error);
    expect (uncaughtError.message).toBe ("failed");
    expect (ctx.completed).toBe (true);
});


test ("nit.Queue.toTask ()", async () =>
{
    let parentContext = {};
    let q1 = nit.Queue ()
        .push (async (ctx) =>
        {
            q1.parentContext = ctx.parent;
            return 11;
        })
    ;

    let q2 = nit.Queue ()
        .push (function ()
        {
            q2.called = true;
        })
        .push (q1)
    ;

    let result = await q2.run (parentContext);

    expect (result).toBe (11);
    expect (q2.called).toBe (true);
    expect (q1.parentContext).toBe (parentContext);
});


test ("nit.Queue.toTask ()", async () =>
{
    let parentContext = {};
    let q1 = nit.Queue ()
        .push (async (ctx) =>
        {
            q1.parentContext = ctx.parent;
            nit.throw ("q1 error");
        })
        .failure (function (ctx)
        {
            q1.error = ctx.error;
        })
    ;

    let q2 = nit.Queue ()
        .push (function ()
        {
            q2.called = true;
        })
        .push (q1)
        .push (async () =>
        {
            await nit.sleep (10);
            return 22;
        })
    ;

    let result = await q2.run (parentContext);

    expect (result).toBe (22);
    expect (q2.called).toBe (true);
    expect (q1.parentContext).toBe (parentContext);
    expect (q1.error.message).toBe ("q1 error");
});


test ("nit.Queue - returns promise on completion", async () =>
{
    let result = await nit.Queue ()
        .success (async function ()
        {
            return 10;
        })
        .complete (function (ctx)
        {
            return Promise.resolve (ctx.result + 1);
        })
        .run ()
    ;

    expect (result).toBe (11);
});


test ("nit.Queue.stop ()", async () =>
{
    let q2 = nit.Queue ()
        .push (function (ctx)
        {
            q2.executed = true;

            return ctx.result + 10;
        })
        .complete (function ()
        {
            q2.completed = true;
        })
    ;

    let q1 = nit.Queue ()
        .push (async function task1 ()
        {
            return 10;
        })
        .push (async function (ctx)
        {
            if (ctx.result >= 10)
            {
                return nit.Queue.Stop (q2);
            }
        })
        .push (async function task2 ()
        {
            q1.task2Executed = true;
        })
        .complete (function ()
        {
            q1.completed = true;
        })
    ;

    q1.task2Executed = false;

    expect (await q1.run ()).toBe (20);
    expect (await q1.completed).toBe (true);
    expect (await q1.task2Executed).toBe (false);

    expect (await q2.executed).toBe (true);
    expect (await q2.completed).toBe (true);
});


test ("nit.Queue - return another Queue from task", async () =>
{
    let q2 = nit.Queue ()
        .push (function (ctx)
        {
            q2.executed = true;

            return ctx.result + 10;
        })
        .complete (function ()
        {
            q2.completed = true;
        })
    ;

    let q1 = nit.Queue ()
        .push (async function task1 ()
        {
            return 10;
        })
        .push (async function ()
        {
            return q2;
        })
        .push (async function task2 ()
        {
            q1.task2Executed = true;
        })
        .complete (function ()
        {
            q1.completed = true;
        })
    ;

    q1.task2Executed = false;

    expect (await q1.run ()).toBe (20);
    expect (await q1.completed).toBe (true);
    expect (await q1.task2Executed).toBe (true);

    expect (await q2.executed).toBe (true);
    expect (await q2.completed).toBe (true);
});


test ("nit.Queue.complete ()", () =>
{
    let ctx = {};
    let err;

    try
    {
        nit.Queue ()
            .push (function ()
            {
                throw new Error ("e1");
            })
            .failure (function ()
            {
                throw new Error ("e2");
            })
            .complete (function ()
            {
                ctx.completeCalled = true;
            })
            .run (ctx)
        ;
    }
    catch (e)
    {
        err = e;
    }

    expect (err.message).toBe ("e2");
    expect (ctx.completeCalled).toBe (true);
});



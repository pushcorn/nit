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
});

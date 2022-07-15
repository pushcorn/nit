test ("nit.sequential ()", async () =>
{
    async function task1 ()
    {
        await nit.sleep (10);
        return 1;
    }

    async function task2 ()
    {
        await nit.sleep (10);
        return 2;
    }

    let start = new Date ();
    expect (await nit.sequential (task1, task2)).toEqual (2);
    expect (Date.now () - start).toBeGreaterThanOrEqual (20);
});

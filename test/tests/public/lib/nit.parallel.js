test ("nit.parallel ()", async () =>
{
    async function task1 ()
    {
        return 1;
    }

    async function task2 ()
    {
        await nit.sleep (10);
        return 2;
    }

    expect (await nit.parallel (task1 (), task2())).toEqual ([1, 2]);
    expect (await nit.parallel (task1, task2)).toEqual ([1, 2]);
});

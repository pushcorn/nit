test ("nit.timezone ()", () =>
{
    expect (nit.timezone ()).toMatch (/^[a-z0-9/_+-]+$/i);
});

test ("nit.timestamp ()", () =>
{
    expect (nit.timestamp ()).toMatch (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect (nit.timestamp (true)).toMatch (/^\d{4}-\d{2}-\d{2}$/);

    if (new Date (2023, 2, 1).getTimezoneOffset () > 0)
    {
        expect (nit.timestamp ("2023-03-01T00:00:00Z", true)).toBe ("2023-02-28");
    }
    else
    {
        expect (nit.timestamp ("2023-03-01T00:00:00Z", true)).toBe ("2023-03-01");
    }

    expect (nit.timestamp (+new Date (2023, 2, 1))).toBe ("2023-03-01 00:00:00");

});

test ("nit.parseDateAtTimezone ()", () =>
{
    let d = nit.parseDateAtTimezone ("2000-01-01 00:00:00", "Asia/Taipei");

    expect (d.toISOString ()).toBe ("1999-12-31T16:00:00.000Z");
});

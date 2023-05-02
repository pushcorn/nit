test ("nit.parseDate ()", () =>
{
    let d;

    expect (nit.parseDate ("ABC")).toBe (undefined);
    expect (nit.parseDate ("2023-04-01")).toBeInstanceOf (Date);

    d = nit.parseDate ("12:13:14.123");
    expect (d).toBeInstanceOf (Date);
    expect (d.getHours ()).toBe (12);
    expect (d.getMinutes ()).toBe (13);
    expect (d.getSeconds ()).toBe (14);
    expect (d.getMilliseconds ()).toBe (123);

    d = nit.parseDate ("2023-01-01T00:00:00Z");
    expect (d.toISOString ()).toBe ("2023-01-01T00:00:00.000Z");

    d = nit.parseDate ("2023-01-01T00:00:00-0400");
    expect (d.toISOString ()).toBe ("2023-01-01T04:00:00.000Z");

    d = nit.parseDate ("2023-01-01T00:00:00+0830");
    expect (d.toISOString ()).toBe ("2022-12-31T15:30:00.000Z");
});

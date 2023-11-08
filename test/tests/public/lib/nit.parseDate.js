test ("nit.parseDate ()", () =>
{
    let d;

    expect (nit.parseDate (new Date (2000, 1, 1))).toBeInstanceOf (Date);
    expect (nit.parseDate ("ABC")).toBe (undefined);
    expect (nit.parseDate ("ABC", "America/Indianapolis")).toBe (undefined);
    expect (nit.parseDate ("2023-04-01")).toBeInstanceOf (Date);
    expect (nit.parseDate ("2023-04")).toBeInstanceOf (Date);
    expect (nit.parseDate ("2023")).toBeInstanceOf (Date);

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


test ("nit.parseDate () with timezone", () =>
{
    function testParseDateAtTimezone (str, tz, utcTimestamp, localTimestamp)
    {
        let m = nit.parseDate.match (str);

        expect (nit.parseDate (str, tz).toISOString ()).toBe (utcTimestamp);
        expect (nit.timestamp (new Date (utcTimestamp), tz, m.hasMillisecond ? { fractionalSecondDigits: 3 } : null).replace ("T", " ")).toBe (localTimestamp);
    }

    testParseDateAtTimezone ("2023-03-12 01:00:00", "America/Indianapolis", "2023-03-12T06:00:00.000Z", "2023-03-12 01:00:00");
    testParseDateAtTimezone ("2023-03-12 02:00:00", "America/Indianapolis", "2023-03-12T07:00:00.000Z", "2023-03-12 03:00:00");
    testParseDateAtTimezone ("2023-03-12 03:00:00", "America/Indianapolis", "2023-03-12T07:00:00.000Z", "2023-03-12 03:00:00");
    testParseDateAtTimezone ("2023-03-12 04:00:00", "America/Indianapolis", "2023-03-12T08:00:00.000Z", "2023-03-12 04:00:00");
    testParseDateAtTimezone ("2023-03-13 04:00:00", "America/Indianapolis", "2023-03-13T08:00:00.000Z", "2023-03-13 04:00:00");
    testParseDateAtTimezone ("2023-03-14 04:00:00", "America/Indianapolis", "2023-03-14T08:00:00.000Z", "2023-03-14 04:00:00");
    testParseDateAtTimezone ("2023-11-05 01:00:00", "America/Indianapolis", "2023-11-05T05:00:00.000Z", "2023-11-05 01:00:00");
    testParseDateAtTimezone ("2023-11-05 02:00:00", "America/Indianapolis", "2023-11-05T07:00:00.000Z", "2023-11-05 02:00:00");
    testParseDateAtTimezone ("2023-11-05 03:00:00", "America/Indianapolis", "2023-11-05T08:00:00.000Z", "2023-11-05 03:00:00");
    testParseDateAtTimezone ("2023-11-05 04:00:00", "America/Indianapolis", "2023-11-05T09:00:00.000Z", "2023-11-05 04:00:00");

    testParseDateAtTimezone ("2023-03-12 01:00:00", "America/St_Johns", "2023-03-12T04:30:00.000Z", "2023-03-12 01:00:00");
    testParseDateAtTimezone ("2023-03-12 02:00:00", "America/St_Johns", "2023-03-12T05:30:00.000Z", "2023-03-12 03:00:00");
    testParseDateAtTimezone ("2023-03-12 02:50:00", "America/St_Johns", "2023-03-12T06:20:00.000Z", "2023-03-12 03:50:00");
    testParseDateAtTimezone ("2023-03-12 03:00:00", "America/St_Johns", "2023-03-12T05:30:00.000Z", "2023-03-12 03:00:00");
    testParseDateAtTimezone ("2023-11-05 01:00:00", "America/St_Johns", "2023-11-05T03:30:00.000Z", "2023-11-05 01:00:00");
    testParseDateAtTimezone ("2023-11-05 02:00:00", "America/St_Johns", "2023-11-05T05:30:00.000Z", "2023-11-05 02:00:00");
    testParseDateAtTimezone ("2023-11-05 03:00:00", "America/St_Johns", "2023-11-05T06:30:00.000Z", "2023-11-05 03:00:00");

    testParseDateAtTimezone ("2023-01-01 00:00:00", "Asia/Taipei", "2022-12-31T16:00:00.000Z", "2023-01-01 00:00:00");
    testParseDateAtTimezone ("2023-01-01 01:00:00", "Asia/Taipei", "2022-12-31T17:00:00.000Z", "2023-01-01 01:00:00");

    testParseDateAtTimezone ("2023-01-01 01:00:00", "GMT", "2023-01-01T01:00:00.000Z", "2023-01-01 01:00:00");

    testParseDateAtTimezone ("2023-01-01 01:00:00", "Indian/Cocos", "2022-12-31T18:30:00.000Z", "2023-01-01 01:00:00");
    testParseDateAtTimezone ("2023-01-01 01:00:00", "Pacific/Marquesas", "2023-01-01T10:30:00.000Z", "2023-01-01 01:00:00");

    testParseDateAtTimezone ("2023-03-26 01:00:00", "CET", "2023-03-26T00:00:00.000Z", "2023-03-26 01:00:00");
    testParseDateAtTimezone ("2023-03-26 02:00:00", "CET", "2023-03-26T01:00:00.000Z", "2023-03-26 03:00:00");
    testParseDateAtTimezone ("2023-03-26 03:00:00", "CET", "2023-03-26T01:00:00.000Z", "2023-03-26 03:00:00");

    testParseDateAtTimezone ("2023-04-27 23:00:00", "Egypt", "2023-04-27T21:00:00.000Z", "2023-04-27 23:00:00");
    testParseDateAtTimezone ("2023-04-28 00:00:00", "Egypt", "2023-04-27T22:00:00.000Z", "2023-04-28 01:00:00");
    testParseDateAtTimezone ("2023-04-28 01:00:00", "Egypt", "2023-04-27T22:00:00.000Z", "2023-04-28 01:00:00");
    testParseDateAtTimezone ("2023-04-28 02:00:00", "Egypt", "2023-04-27T23:00:00.000Z", "2023-04-28 02:00:00");
    testParseDateAtTimezone ("2023-04-28 03:00:00", "Egypt", "2023-04-28T00:00:00.000Z", "2023-04-28 03:00:00");

    testParseDateAtTimezone ("2023-10-26 22:00:00", "Egypt", "2023-10-26T19:00:00.000Z", "2023-10-26 22:00:00");
    testParseDateAtTimezone ("2023-10-26 23:00:00", "Egypt", "2023-10-26T20:00:00.000Z", "2023-10-26 23:00:00");
    testParseDateAtTimezone ("2023-10-27 00:00:00", "Egypt", "2023-10-26T22:00:00.000Z", "2023-10-27 00:00:00");
    testParseDateAtTimezone ("2023-10-27 01:00:00", "Egypt", "2023-10-26T23:00:00.000Z", "2023-10-27 01:00:00");
    testParseDateAtTimezone ("2023-10-27 02:00:00.001", "Egypt", "2023-10-27T00:00:00.001Z", "2023-10-27 02:00:00.001");
});

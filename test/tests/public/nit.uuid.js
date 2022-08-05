test ("nit.uuid () returns a random UUID.", () =>
{
    expect (nit.uuid ()).toEqual (expect.stringMatching (/^[0-9a-z]{32}$/));
    expect (nit.uuid (true)).toEqual (expect.stringMatching (/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/));
});

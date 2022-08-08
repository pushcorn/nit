test ("nit.uuid () returns a random UUID.", () =>
{
    expect (nit.uuid (true)).toEqual (expect.stringMatching (/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/));

    const no_crypto = require ("crypto");

    global.crypto = {};
    expect (nit.uuid ()).toEqual (expect.stringMatching (/^[0-9a-z]{32}$/));

    global.crypto.getRandomValues = (arr) => no_crypto.getRandomValues (arr);
    expect (nit.uuid ()).toEqual (expect.stringMatching (/^[0-9a-z]{32}$/));

    global.crypto.randomUUID = () => no_crypto.randomUUID ();
    expect (nit.uuid ()).toEqual (expect.stringMatching (/^[0-9a-z]{32}$/));
});

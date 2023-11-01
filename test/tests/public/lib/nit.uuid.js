test ("nit.uuid () returns a random UUID.", () =>
{
    expect (nit.uuid (true)).toEqual (expect.stringMatching (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/));

    const no_crypto = require ("crypto");
    const performance = global.performance;

    global.crypto = {};
    expect (nit.uuid ()).toEqual (expect.stringMatching (/^[0-9a-f]{32}$/));

    try
    {
        delete global.performance;

        expect (nit.uuid ()).toEqual (expect.stringMatching (/^[0-9a-f]{32}$/));
    }
    finally
    {
        global.performance = performance;
    }

    global.crypto.getRandomValues = (arr) => no_crypto.webcrypto.getRandomValues (arr);
    expect (nit.uuid ()).toEqual (expect.stringMatching (/^[0-9a-f]{32}$/));

    global.crypto.randomUUID = () => no_crypto.randomUUID ();
    expect (nit.uuid ()).toEqual (expect.stringMatching (/^[0-9a-f]{32}$/));

    global.crypto = null;
    expect (nit.uuid ()).toEqual (expect.stringMatching (/^[0-9a-f]{32}$/));
});

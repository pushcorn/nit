test ("nit arg expander: configFile", () =>
{
    nit.config ("test.config..file", "test/resources/test-config.json");

    expect (nit.CONFIG.test.config).toBe (`{
    "name": "test",
    "value": "a test value"
}
`);
});

test ("nit arg expander: file", () =>
{
    nit.config ("test.config..file", "test/resources/test-config.json");

    expect (nit.CONFIG.test.config).toBe (`{
    "name": "test",
    "value": "a test value"
}
`);
});

test ("nit arg expander: fileAsync", async () =>
{
    await nit.config ("test.config..fileAsync", "test/resources/test-config.json");

    expect (nit.CONFIG.test.config).toBe (`{
    "name": "test",
    "value": "a test value"
}
`);
});

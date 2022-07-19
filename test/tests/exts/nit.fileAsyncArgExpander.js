test ("nit.fileAsyncArgExpander.js", async () =>
{
    await nit.config ("test.config..fileAsync", "test/resources/test-config.json");

    expect (nit.CONFIG.test.config).toBe (`{
    "name": "test",
    "value": "a test value"
}
`);
});

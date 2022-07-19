test ("nit.fileArgExpander.js", () =>
{
    nit.config ("test.config..file", "test/resources/test-config.json");

    expect (nit.CONFIG.test.config).toBe (`{
    "name": "test",
    "value": "a test value"
}
`);
});

test ("nit.configFileArgExpander", () =>
{
    nit.config ("test.config..configFile", "test/resources/test-config.json");

    expect (nit.CONFIG.test.config.value).toBe ("a test value");
});

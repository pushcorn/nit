test ("nit.expandArg ()", async () =>
{
    nit.config ("env", "prod");
    nit.config ("defaults.api.endpoint",
    {
        dev: "https://dev.local/api",
        prod: "https://prod.local/api"
    });


    nit.config ("api.endpoint..tpl", "{{defaults.api.endpoint.{{env}}}}");
    expect (nit.CONFIG.api.endpoint).toBe ("https://prod.local/api");
    nit.config ("api.endpoint2..fmt", "%{defaults.api.endpoint.%{env}}");
    expect (nit.CONFIG.api.endpoint2).toBe ("https://prod.local/api");

    nit.config ("vals.arr..val", "[1, 2]");
    expect (nit.CONFIG.vals.arr).toEqual ([1, 2]);

    nit.ENV.hostname = "nit";
    nit.config ("vals.hostname..env", "hostname");
    expect (nit.CONFIG.vals.hostname).toBe ("nit");

    nit.assign (nit.ENV,
    {
        CFG_A_B: "aaaBBB",
        CFG_C_D: "CCCddd"
    });

    expect (() => nit.config ("vals.map..envMap", ""))
        .toThrow (/from.*is required/);

    nit.config ("vals.map..envMap", "CFG");
    expect (nit.CONFIG.vals.map).toEqual (
    {
        a: { b: "aaaBBB" },
        c: { d: "CCCddd" }
    });

    nit.assign (nit.ENV,
    {
        CFG_A_B: "AB",
        CFG_C_D: "CD"
    });

    nit.config ("vals.map..envMap", "CFG_");
    expect (nit.CONFIG.vals.map).toEqual (
    {
        a: { b: "AB" },
        c: { d: "CD" }
    });

    nit.config ("vals.map..envMap", ["CFG_", "new"]);
    expect (nit.CONFIG.vals.map).toEqual (
    {
        new:
        {
            a: { b: "AB" },
            c: { d: "CD" }
        }
    });

    nit.config ("vals.map..envMap", ["CFG_", "another."]);
    expect (nit.CONFIG.vals.map).toEqual (
    {
        another:
        {
            a: { b: "AB" },
            c: { d: "CD" }
        }
    });

    nit.ns ("app.config.value", "app config");
    nit.config ("vals.ns..ns", "app.config");
    expect (nit.CONFIG.vals.ns).toEqual ({ value: "app config" });

    expect (() => nit.expandArg ("noname")).toThrow (/noname.*was not registered/);
});

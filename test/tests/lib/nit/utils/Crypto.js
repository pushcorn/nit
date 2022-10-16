test ("nit.utils.Crypto", () =>
{
    const Crypto = nit.require ("nit.utils.Crypto");

    expect (Crypto.hash ("md5", "test")).toBe ("098f6bcd4621d373cade4e832627b4f6");
    expect (Crypto.md5 ("test")).toBe ("098f6bcd4621d373cade4e832627b4f6");
    expect (Crypto.sha1 ("test")).toBe ("a94a8fe5ccb19ba61c4c0873d391e987982fbbd3");
});

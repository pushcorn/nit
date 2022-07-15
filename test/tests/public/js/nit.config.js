test ("nit.config ()", async () =>
{
    nit.config ("a.b", 3);
    expect (nit.CONFIG.a.b).toBe (3);

    nit.config ("c.d", { "e.f": 9 });
    expect (nit.CONFIG.c.d).toEqual ({ "e.f": 9 });

    nit.ENV.cpu = "x86";
    nit.config ("cpu..env", "cpu");
    expect (nit.CONFIG.cpu).toBe ("x86");

    nit.ENV.file = "test.txt";
    nit.config ("file..env!", "file");
    expect (nit.CONFIG.file).toEqual ({ "": { env: "file" } });

    nit.Template.registerTransform ("getMyIp", async () =>
    {
        return "127.0.0.3";
    });


    nit.config ("my.ip..tpl", "{{|getMyIp}}");
    expect (nit.CONFIG.my).toBeUndefined ();
    await nit.sleep (10);
    expect (nit.CONFIG.my).toEqual ({ ip: "127.0.0.3" });

    nit.config ("a.b?", 9);
    expect (nit.CONFIG.a.b).toBe (3);

    nit.config ("a.c?", 9);
    expect (nit.CONFIG.a.c).toBe (9);

    nit.config ("c.d", { "e": 6 });
    expect (nit.CONFIG.c.d).toEqual ({ e: 6 });

    nit.config ("c.d+", { "f": 7 });
    expect (nit.CONFIG.c.d).toEqual ({ e: 6, f: 7 });

    nit.config ("c.d", [1, 2]);
    expect (nit.CONFIG.c.d).toEqual ([1, 2]);

    nit.config ("c.d+", [3, 4]);
    expect (nit.CONFIG.c.d).toEqual ([1, 2, 3, 4]);

    nit.config ("c.d+", { x: 1 });
    expect (nit.CONFIG.c.d).toEqual ([1, 2, 3, 4, { x: 1 }]);

    nit.config ("c.d-");
    expect (nit.CONFIG.c.d).toBeUndefined ();

    nit.config ("c-");
    expect (nit.CONFIG.c).toBeUndefined ();

    nit.config ("-");
    expect (nit.CONFIG.cpu).toBe ("x86");

    nit.config ("cpu+", "arm");
    expect (nit.CONFIG.cpu).toBe ("arm");

    expect (nit.config ("cpu")).toBe ("arm");
    expect (nit.config ("a.b")).toBe (3);
    expect (nit.config ()).toBe (nit.CONFIG);
});

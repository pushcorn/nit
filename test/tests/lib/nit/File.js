test ("nit.File", async () =>
{
    let file = nit.new ("nit.File", nit.path.join (nit.NIT_HOME, "package.json"));

    expect (file.read ()).toMatch (/@pushcorn\/nit/);
    expect (await file.readAsync ()).toMatch (/@pushcorn\/nit/);
    expect (file.exists ()).toBe (true);
    expect (file.stat ().constructor.name).toBe ("Stats");

    let tmp = nit.new ("nit.File", nit.path.join (nit.os.tmpdir (), nit.uuid () + "test"));
    let uuid = nit.uuid ();

    tmp.write (uuid);
    expect (tmp.read ()).toBe (uuid);

    uuid = nit.uuid ();
    await tmp.writeAsync (uuid);
    expect (tmp.read ()).toBe (uuid);

    let buffer = Buffer.from ("1234");
    tmp.write (buffer);
    expect (tmp.read ()).toBe ("1234");

    file = nit.File (nit.path.join ("~", ".nit"));
    expect (file.path).toBe (nit.path.join (nit.USER_HOME, ".nit"));

    let copy = nit.new ("nit.File", nit.path.join (nit.os.tmpdir (), nit.uuid () + "copy"));
    tmp.copy (copy.path);
    expect (copy.read ()).toBe ("1234");

    copy.rm ();
    expect (copy.exists ()).toBe (false);
});

test ("nit.File - file primitive type", () =>
{
    nit.require ("nit.File");

    let parser = nit.Object.findTypeParser ("file");

    expect (parser).toBeInstanceOf (nit.Object.PrimitiveTypeParser);
    expect (parser.cast ("filename")).toBe ("filename");
});


test ("nit.File.completers.File.completeForType ()", () =>
{
    nit.require ("nit.Compgen");

    let comp = nit.File.completers.File;

    const A = nit.defineCommand ("TestCommand")
        .defineInput (Input =>
        {
            Input
                .option ("file1", "file")
                .option ("file2", "nit.File")
                .option ("file3", "string")
            ;
        })
    ;

    let ctx = new nit.Compgen.Context ({ currentOption: A.Input.fieldMap.file1 });
    expect (comp.completeForType (ctx)).toEqual ([nit.Compgen.ACTIONS.FILE]);

    ctx = new nit.Compgen.Context ({ currentOption: A.Input.fieldMap.file2 });
    expect (comp.completeForType (ctx)).toEqual ([nit.Compgen.ACTIONS.FILE]);

    ctx = new nit.Compgen.Context ({ currentOption: A.Input.fieldMap.file3 });
    expect (comp.completeForType (ctx)).toBeUndefined ();
});


test ("nit.File", async () =>
{
    let file = nit.new ("nit.File", nit.path.join (nit.HOME, "package.json"));

    expect (file.read ()).toMatch (/@pushcorn\/nit/);
    expect (await file.readAsync ()).toMatch (/@pushcorn\/nit/);
    expect (file.exists ()).toBe (true);
    expect (file.stat ().constructor.name).toBe ("Stats");
    expect (file.basename).toBe ("package.json");
    expect (file.dirname).toBe (nit.HOME);

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
    expect (file.path).toBe ("~/.nit");
    expect (file.absPath).toBe (nit.path.join (nit.USER_HOME, ".nit"));

    let copy = nit.new ("nit.File", nit.path.join (nit.os.tmpdir (), nit.uuid () + "copy"));
    tmp.copy (copy.path);
    expect (copy.read ()).toBe ("1234");

    copy.rm ();
    expect (copy.exists ()).toBe (false);
});

test ("nit.Dir", async () =>
{
    let prefix = nit.uuid ();
    let path;
    let dir = nit.new ("nit.Dir", path = nit.path.join (nit.os.tmpdir (), prefix, "a/nested/dir"));
    dir.create ();

    expect (nit.isDir (path)).toBe (true);

    dir.rm ();
    expect (nit.isDir (path)).toBe (false);

    let file = nit.new ("nit.File", nit.path.join (nit.os.tmpdir (), prefix, "a/file"));
    file.write ("a file");

    let dir2 = nit.new ("nit.Dir", nit.path.join (nit.os.tmpdir (), prefix, "a/file/dir"));
    expect (() => dir2.create ()).toThrow (/points to a non-directory/);

    let dir3 = nit.new ("nit.Dir", nit.path.join (nit.os.tmpdir (), prefix, "a/file"));
    expect (() => dir3.create ()).toThrow (/points to a non-directory/);

    let dir4 = nit.new ("nit.Dir", nit.path.join (nit.os.tmpdir (), prefix, "a"));

    let [f, n] = dir4.read (true);

    expect (f.name).toBe ("file");
    expect (f.isDirectory ()).toBe (false);
    expect (n.name).toBe ("nested");
    expect (n.isDirectory ()).toBe (true);

    expect (dir4.read ()).toEqual (["file", "nested"]);
    expect (await dir4.readAsync ()).toEqual (["file", "nested"]);

    dir = nit.new ("nit.Dir", path = nit.path.join (nit.os.tmpdir (), prefix, "a"));
    dir.rm ();
    expect (nit.isDir (path)).toBe (false);

    let content = nit.uuid ();
    dir.writeFile ("a/b/c.txt", content);
    expect (dir.readFile ("a/b/c.txt")).toBe (content);

    await dir.writeFileAsync ("a/b/d.txt", content);
    expect (await dir.readFileAsync ("a/b/d.txt")).toBe (content);
    expect (dir.exists ()).toBe (true);

    dir = nit.new ("nit.Dir", "a");
    expect (dir.join ("b/c", true)).toBe ("a/b/c");
});

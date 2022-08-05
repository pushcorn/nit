test ("exts/nit.Object.js", () =>
{
    const Copy = nit.defineClass ("Copy")
        .field ("[from]", "file")
    ;

    expect (new Copy ("aa").from).toBe ("aa");
    expect (new Copy ().from).toBe ("");

    let copy = new Copy ();

    expect (() => (copy.from = {})).toThrow (/should be a file/);
    expect (() => (copy.from = Copy)).toThrow (/should be a file/);
});

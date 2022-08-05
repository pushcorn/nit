test ("exts/nit.Compgen.js", async () =>
{
    let logContent;

    process.env.COMP_LINE = "command";
    process.env.COMP_POINT = "command".length;
    process.argv = ["node", global.nit.NIT_HOME];
    console.log = function () { logContent = global.nit.array (arguments); };

    const nit = await test.reloadNit ();
    const Completer = nit.lookupClass ("nit.compgen.Completer");

    expect (nit.CLASSES["nit.compgen.completers.File"].superclass).toBe (Completer);
    expect (nit.CLASSES["nit.compgen.completers.Choice"].superclass).toBe (Completer);
    expect (logContent).toEqual (["NONE"]);
});

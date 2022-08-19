test ("commands.Console", async () =>
{
    const no_repl = require ("repl");

    let addLineCb;
    let server =
    {
        context: {},
        history: [],

        enterLine: function (line)
        {
            server.history.unshift (line);
            addLineCb (line);
        }
        ,
        addListener: function (event, cb)
        {
            if (event == "line")
            {
                addLineCb = cb;
            }
        }
    };

    no_repl.start = function ()
    {
        return server;
    };

    const nit = await test.setupCliMode ("console", true);
    const Console = nit.lookupCommand ("console");

    let log = nit.log = test.mockConsoleLog ();
    await Console.run ();

    expect (log.restore ()).toEqual (["Welcome to the nit console!"]);
    expect (server.history).toEqual ([]);

    let history = nit.new ("nit.File", nit.path.join (nit.os.tmpdir (), nit.uuid ()));
    history.write ("");
    server.history = [];
    await Console.run (["--history", history.path]);
    let line = "a = 1";

    server.enterLine (line);
    expect (history.read ()).toBe ("a = 1");

    server.enterLine (line);
    expect (history.read ()).toBe ("a = 1");

    await Console.run (["--history", history.path]);
    expect (server.history).toEqual (["a = 1"]);
});

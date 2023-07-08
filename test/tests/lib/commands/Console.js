test ("commands.Console", async () =>
{
    const no_repl = require ("repl");

    let lineCb;
    let exitCb;
    let server =
    {
        context: {},
        history: [],

        enterLine: function (line)
        {
            server.history.unshift (line);
            lineCb (line);
        }
        ,
        addListener: function (event, cb)
        {
            if (event == "line")
            {
                lineCb = cb;
            }
            else
            if (event == "exit")
            {
                exitCb = cb;
            }
        }
        ,
        on: function (event, cb)
        {
            this.addListener (event, cb);

            return this;
        }
    };

    no_repl.start = function ()
    {
        return server;
    };

    const nit = await test.setupCliMode ("console", true);
    const Console = nit.lookupCommand ("console");

    let mock = test.mock (nit, "log");
    await Console ().run ({ history: nit.uuid () });

    expect (mock.invocations[0].args).toEqual (["Welcome to the nit console!"]);
    expect (server.history).toEqual ([]);

    let history = nit.new ("nit.File", nit.path.join (nit.os.tmpdir (), nit.uuid ()));
    history.write ("");
    server.history = [];

    mock = test.mock (nit, "log");
    await Console ().run (["--history", history.path]);
    let line = "a = 1";

    server.enterLine (line);
    expect (history.read ()).toBe ("a = 1");

    server.enterLine (line);
    expect (history.read ()).toBe ("a = 1");

    mock = test.mock (nit, "log");
    await Console ().run ("--history", history.path);
    expect (server.history).toEqual (["a = 1"]);

    let emitMock = test.mock (process, "emit");
    let exitMock = test.mock (process, "exit");
    exitCb ();

    expect (emitMock.invocations.length).toBe (1);
    expect (emitMock.invocations[0].args).toEqual (["SHUTDOWN"]);
    expect (exitMock.invocations.length).toBe (1);
});

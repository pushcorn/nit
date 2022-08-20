test ("nit.test.Mock", async () =>
{
    nit.lookupClass ("nit.test.Mock");

    const Database = nit.test.defineMock ("Database")
        .method ("connect", async function ()
        {
            return true;
        })
        .method ("query", async function ()
        {
            this.count = 3;

            return [{ a: 1 }];
        })
        .method ("version", "1.0")
    ;

    let database = new Database;
    await database.connect ();
    await database.query ("SELECT * FROM table_a");

    expect (database.connect.invocations[0]).toEqual (
    {
        this: {},
        args: [],
        result: true
    });

    expect (database.query.invocations[0]).toEqual (
    {
        this: { count: 3 },
        args: ["SELECT * FROM table_a"],
        result: [{ a: 1 }]
    });

    expect (database.version ()).toBe ("1.0");

    database.query.reset ();
    expect (database.query.invocations).toEqual ([]);
});

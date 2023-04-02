test ("nit.log () logs the given arguments with console.log.", () =>
{
    let args = ["a", 3, false, { a: 9 }];
    let logged = [];

    nit.log.logger = function ()
    {
        logged = nit.array (arguments);
    };

    nit.log.apply (nit, args);

    expect (logged[0]).toBe ("a");
    expect (logged[1]).toBe (3);
    expect (logged[2]).toBe (false);
    expect (logged[3]).toEqual ({ a: 9 });
});


test ("nit.log.formatMessage () formats the input args into a message string.", () =>
{
    expect (nit.log.formatMessage ("hello %{name}", { name: "there" })).toBe ("hello there");
    expect (nit.log.formatMessage (new Error ("ERR!"))).toMatch (/^Error: ERR!/);
    expect (nit.log.formatMessage ({ a: 1, b: 2 })).toBe ('{"a":1,"b":2}');
});

test ("nit.log.<level> () log messages with a log level prefix.", () =>
{
    let logged = [];

    nit.log.logger = function ()
    {
        logged.push (nit.array (arguments));
    };

    nit.log.i ("The message is %{message}", { message: "one" });
    nit.log.warn ("The message is %{message}", { message: "two" });

    expect (logged[0]).toEqual (["[INFO]", "The message is one"]);
    expect (logged[1]).toEqual (["[WARN]", "The message is two"]);
});

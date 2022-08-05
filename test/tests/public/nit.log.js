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


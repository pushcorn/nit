test ("nit.Class", () =>
{
    let User = nit.defineClass ("nit.User");
    let obj;

    expect (nit.classChain (User)).toEqual ([User, nit.Class, nit.Object]);
    expect (() => User.constraint ("minInt", 10)).toThrow (/no field was defined/i);

    User.field ("<id>", "string", "The user ID.");

    expect (() => User.constraint ("minInt", 10)).toThrow (/constraint.*min.*not defined/i);

    nit.defineConstraint ("MinInt")
        .throws ("less_than_min", "The minimum value of '%{property.name}' is '%{constraint.min}'.")
        .property ("<min>", "integer")
        .appliesTo ("integer")
        .validate (function (value, ctx)
        {
            return value >= ctx.constraint.min;
        })
    ;

    expect (() => User.constraint ("minInt", 10)).toThrow (/constraint.*min.*cannot be applied/i);
    expect (() => new User).toThrow (/id.*required/);
    expect (new User ("1234").id).toBe ("1234");

    User.preConstruct (function (params)
    {
        User.preConstruct.params = params;
    });

    obj = new User ("1234");
    expect (User.preConstruct.params).toEqual ({});

    User.postConstruct (function (obj)
    {
        User.postConstruct.obj = obj;
    });

    obj = new User ("5555");
    expect (User.postConstruct.obj).toBe (obj);
    expect (() => new User (nit.noop)).toThrow (/given.*function/i);

    User
        .field ("age", "integer", "The user age.", 10)
            .constraint ("minInt", 10)
    ;

    expect (() => new User ("007", { age: 2 })).toThrow (/minimum.*is.*10/);
    expect (nit.clone (new User ("007", { age: 20 }))).toEqual ({ id: "007", age: 20 });
    expect (User.getField ("age").name).toBe ("age");
});


test ("nit.Class.ns ()", () =>
{
    nit.User.ns ("api");

    expect (nit.User.api).toBeInstanceOf (Function);
    expect (nit.getSuperclass (nit.User.api)).toBe (nit.Class);
});

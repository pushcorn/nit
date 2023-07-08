test ("nit.Class", () =>
{
    let User = nit.defineClass ("nit.User");
    let obj;

    expect (nit.classChain (User)).toEqual ([User, nit.Class, nit.Object]);
    expect (() => User.constraint ("minInt", 10)).toThrow (/no field was defined/i);

    User.field ("<id>", "string", "The user ID.");

    expect (() => User.constraint ("minInt", 10)).toThrow (/constraint.*min.*not defined/i);

    nit.defineConstraint ("constraints.MinInt")
        .throws ("less_than_min", "The minimum value of '%{property.name}' is '%{constraint.min}'.")
        .property ("<min>", "integer")
        .appliesTo ("integer")
        .onValidate (function (ctx)
        {
            return ctx.value >= ctx.constraint.min;
        })
    ;

    expect (() => User.constraint ("minInt", 10)).toThrow (/constraint.*min.*cannot be applied/i);
    expect (() => new User).toThrow (/id.*required/);
    expect (new User ("1234").id).toBe ("1234");

    User.onPreConstruct (function (params)
    {
        User.preConstruct.params = params;
    });

    obj = new User ("1234");
    expect (User.preConstruct.params).toEqual ({});

    User.onPostConstruct (function (obj)
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


test ("nit.Class.registerPlugin ()", () =>
{
    const Condition = nit.defineClass ("nit.utils.Condition")
        .field ("<check>", "string")
    ;

    const CheckOne = nit.defineClass ("conditions.CheckOne", "nit.utils.Condition"); // eslint-disable-line no-unused-vars
    const CheckTwo = nit.defineClass ("conditions.CheckTwo", "nit.utils.Condition");

    const A = nit.defineClass ("A")
        .registerPlugin (Condition)
    ;


    expect (nit.propertyDescriptors (A, true).conditions).toBeInstanceOf (Object);
    expect (nit.propertyDescriptors (A, true).condition.value).toBeInstanceOf (Function);

    A.condition ("check-one", "a");
    A.condition (new CheckTwo ("b"));

    expect (A.conditions[0].check).toBe ("a");
    expect (A.conditions[1].check).toBe ("b");

    nit.defineClass ("nit.utils.TestPlugin");

    const B = nit.defineClass ("B")
        .registerPlugin ("nit.utils.TestPlugin")
    ;

    expect (nit.propertyDescriptors (B, true).testplugins).toBeInstanceOf (Object);
    expect (nit.propertyDescriptors (B, true).testplugin.value).toBeInstanceOf (Function);
});


test ("nit.Class.getChecks ()", () =>
{
    const DummyConstraint = nit.defineConstraint ("test.constraints.Dummy")
        .onValidate (() => true)
    ;

    const Country = nit.defineModel ("Country")
        .field ("<name>", "string")
        .check ("test:dummy")
    ;

    expect (Country.getChecks ("test:dummy")[0]).toBeInstanceOf (DummyConstraint);
    expect (Country.getChecks ()[0]).toBeInstanceOf (DummyConstraint);
});

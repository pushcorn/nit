test ("nit.Class", () =>
{
    let User = nit.defineClass ("nit.User");

    expect (nit.classChain (User)).toEqual ([User, nit.Class, nit.Object]);
    expect (() => User.constraint ("minInt", 10)).toThrow (/no field was defined/i);

    User.field ("<id>", "string", "The user ID.");

    expect (() => User.constraint ("minInt", 10)).toThrow (/constraint.*min.*not defined/i);

    nit.defineConstraint ("constraints.MinInt")
        .throws ("less_than_min", "The minimum value of '%{property.name}' is '%{constraint.min}'.")
        .property ("<min>", "integer")
        .meta ("applicableTypes", "integer")
        .onValidate (function (ctx)
        {
            return ctx.value >= ctx.constraint.min;
        })
    ;

    expect (() => User.constraint ("minInt", 10)).toThrow (/constraint.*min.*cannot be applied/i);
    expect (() => new User).toThrow (/id.*required/);
    expect (new User ("1234").id).toBe ("1234");

    User.onPreConstruct (function (arg)
    {
        User.preConstruct.arg = arg;
    });

    User ("1234");
    expect (User.preConstruct.arg).toEqual ("1234");

    User.onPostConstruct (function (arg)
    {
        User.postConstruct.arg = arg;
    });

    User ("5555");
    expect (User.postConstruct.arg).toBe ("5555");
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


test ("nit.Class.registerPlugin", () =>
{
    const Condition = nit.defineClass ("test.Condition");
    const RequestPath = Condition.defineSubclass ("test.RequestPath").field ("<val>");
    const RequestMethod = Condition.defineSubclass ("test.RequestMethod").field ("<val>");
    const A = nit.defineClass ("A")
        .registerPlugin (Condition, true)
        .condition (new RequestPath ("p1"))
        .condition (new RequestMethod ("m1"))
        .condition (new RequestPath ("p2"))
        .condition (new RequestMethod ("m2"))
    ;

    const B = nit.defineClass ("B", "A")
        .condition (new RequestPath ("p3"))
        .condition (new RequestMethod ("m3"))
        .condition (new RequestPath ("p4"))
    ;

    expect (A.conditions.length).toBe (2);
    expect (A.getPlugins ("conditions").length).toBe (2);
    expect (A.getPlugins ("conditions", true).length).toBe (2);
    expect (A.getPlugins ("conditions", true)[0].val).toBe ("p2");
    expect (A.getPlugins ("conditions", true)[1].val).toBe ("m2");

    expect (B.conditions.length).toBe (2);
    expect (B.getPlugins ("conditions").length).toBe (4);
    expect (B.getPlugins ("conditions", true).length).toBe (2);
    expect (B.getPlugins ("conditions", true)[0].val).toBe ("m3");
    expect (B.getPlugins ("conditions", true)[1].val).toBe ("p4");
});


test ("nit.Class.getPlugins", () =>
{
    const Condition = nit.defineClass ("test.Condition");
    const RequestPath = Condition.defineSubclass ("test.RequestPath").field ("<val>");
    const RequestMethod = Condition.defineSubclass ("test.RequestMethod").field ("<val>");
    const A = nit.defineClass ("A")
        .registerPlugin (Condition)
        .condition (new RequestPath ("p1"))
        .condition (new RequestMethod ("m1"))
        .condition (new RequestPath ("p2"))
        .condition (new RequestMethod ("m2"))
    ;

    const B = nit.defineClass ("B", "A")
        .condition (new RequestPath ("p3"))
        .condition (new RequestMethod ("m3"))
    ;

    expect (A.conditions.length).toBe (4);
    expect (A.getPlugins ("conditions").length).toBe (4);
    expect (A.getPlugins ("conditions", true).length).toBe (2);
    expect (A.getPlugins ("conditions", true)[0].val).toBe ("p1");
    expect (A.getPlugins ("conditions", true)[1].val).toBe ("m1");

    expect (B.conditions.length).toBe (2);
    expect (B.getPlugins ("conditions").length).toBe (6);
    expect (B.getPlugins ("conditions", true).length).toBe (2);
    expect (B.getPlugins ("conditions", true)[0].val).toBe ("p3");
    expect (B.getPlugins ("conditions", true)[1].val).toBe ("m3");
    expect (B.getPlugins ("conditions", () => "p3").length).toBe (1);
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

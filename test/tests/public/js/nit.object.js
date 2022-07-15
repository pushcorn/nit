test ("nit.object () creates an instance of nit.object and merges the data from arguments.", () =>
{
    let obj = nit.object ({ a: 3 }, { b: 4 });

    expect (obj).toBeInstanceOf (nit.object);
    expect (obj).toEqual ({ a: 3, b: 4 });
});

test ("nit.Object", () =>
{
    let obj;

    expect (nit.Object ()).toBeInstanceOf (nit.Object);
    expect (nit.Object.name).toBe ("nit.Object");

    const MyClass = nit.Object.defineSubclass ("MyClass")
        .m ("error.invalid_name", "The name '%{name}' is invalid.")
        .k ("verify")
        .property ("name", "string", "my_name")
    ;

    obj = new MyClass ();
    expect (obj.t ("error.invalid_name")).toBe ("The name 'my_name' is invalid.");


    const MySubclass = nit.Object.defineSubclass ("MySubclass", function (email, password) // eslint-disable-line no-unused-vars
        {
        })
        .extend (MyClass)
    ;

    const Task = nit.Object.defineSubclass (true, function Task (job) // eslint-disable-line no-unused-vars
        {
        })
    ;

    expect (MyClass.name).toBe ("MyClass");
    expect (nit.m.MESSAGES["MyClass|error.invalid_name"]).toBe ("The name '%{name}' is invalid.");
    expect (MyClass.kVerify).toBe ("MyClass.verify");
    expect (MyClass.t ("error.invalid_name", { name: "this" })).toBe ("The name 'this' is invalid.");
    expect (() => MyClass.throw ("error.invalid_name", { name: "that" })).toThrow ("The name 'that' is invalid.");

    expect (nit.classChain (MySubclass)).toEqual ([MySubclass, MyClass, nit.Object]);
    expect (nit.NS.MySubclass).toBe (MySubclass);

    expect (Task.name).toBe ("Task");
    expect (nit.NS.Task).toBeUndefined ();
    expect (() => nit.Object.defineSubclass (function () {})).toThrow (/class name cannot be empty/);


    let emailProp = nit.Object.Property.createFor (MyClass, "<email>", "string");
    let fileProp = nit.Object.Property.createFor (MyClass, "<file...>", "string");
    let funcProp = nit.Object.Property.createFor (MyClass, "func", "function");
    let dateProp = nit.Object.Property.createFor (MyClass, "date", "Date", () => new Date);

    expect (emailProp).toMatchObject (
    {
        array: false,
        name: "email",
        positional: true,
        required: true,
        spec: "<email>",
        type: "string",
        defval: ""
    });

    expect (fileProp).toMatchObject (
    {
        array: true,
        name: "file",
        positional: true,
        required: true,
        type: "string",
        defval: ""
    });

    expect (dateProp.get.call ({})).toBeInstanceOf (Date);
    expect (() => nit.Object.Property.createFor (MyClass, "<>", "string")).toThrow (/name.*required/);
    expect (() => nit.Object.Property.createFor (MyClass, "arg", "array")).toThrow (/property.*assigned.*invalid type/);

    expect (emailProp.get.call (obj = {})).toBe ("");
    expect (nit.clone.deep (obj)).toEqual ({ $__email: "" });
    expect (emailProp.get.call (obj)).toBe ("");

    expect (() => emailProp.set.call (obj)).toThrow (/email.*required/);
    expect (() => emailProp.set.call (obj, [1, 2])).toThrow (/email.*should be.*string/);
    expect (() => emailProp.set.call (obj, {a: 3})).toThrow (/email.*should be.*string/);

    emailProp.set.call (obj, 3);
    expect (obj.$__email).toBe ("3");

    expect (emailProp.set.call (obj, "a@b.com")).toBeUndefined ();
    expect (fileProp.set.call (obj, ["a.txt", "b.txt"])).toBeUndefined ();

    expect (funcProp.set.call (obj, undefined)).toBeUndefined ();
    expect (nit.clone.deep (obj)).toEqual (
    {
      '$__email': 'a@b.com',
      '$__file': ['a.txt', 'b.txt'],
      '$__func': undefined
    });

    nit.Object.dpv (obj, "age", "integer", 10);
    expect (Object.getOwnPropertyDescriptor (obj, "age").get[nit.Object.kProperty]).toMatchObject ({ array: false, name: "age", defval: 10 });

    MyClass.constant ("MAX_SIZE", 20);
    expect (MyClass.MAX_SIZE).toBe (20);
    MyClass.MAX_SIZE = 30;
    expect (MyClass.MAX_SIZE).toBe (20);

    MyClass.staticProperty ("sa");
    expect (MyClass.sa).toBe ("");
    MyClass.sa = "str";
    expect (MyClass.sa).toBe ("str");
    MyClass.sa = 33;
    expect (MyClass.sa).toBe ("33");
    MyClass.sa = true;
    expect (MyClass.sa).toBe ("true");

    MyClass.staticProperty ("sb", "integer");
    expect (MyClass.sb).toBe (0);
    MyClass.sb = 10;
    expect (MyClass.sb).toBe (10);
    expect (() => MyClass.sb = "str").toThrow (/should be an integer/);

    MyClass.staticMethod ("s_method", function ()
    {
        return "s_method";
    });
    expect (MyClass.s_method ()).toBe ("s_method");

    MyClass.property ("str_prop");
    obj = new MyClass;
    expect (obj.str_prop).toBe ("");
    obj.str_prop = "str";
    expect (obj.str_prop).toBe ("str");

    MyClass.property ("int_prop", "integer", 3, true, false);
    obj = new MyClass;
    expect (obj.int_prop).toBe (3);
    obj.int_prop = 10;
    expect (obj.int_prop).toBe (10);
    expect (() => obj.int_prop = "str").toThrow (/should be an integer/);

    MyClass.property ("bool_prop", "boolean");
    obj = new MyClass;
    expect (obj.bool_prop).toBe (false);
    obj.bool_prop = true;
    expect (obj.bool_prop).toBe (true);
    expect (() => obj.bool_prop = "str").toThrow (/should be a boolean/);

    MyClass.property ("object_prop", "object");
    obj = new MyClass;
    expect (obj.object_prop).toEqual ({});
    obj.object_prop = nit.object ({ a: 3 });
    expect (obj.object_prop).toEqual ({ a: 3 });
    expect (obj.object_prop).toBeInstanceOf (nit.object);
    expect (() => obj.object_prop = "str").toThrow (/should be an object/);

    MyClass.property ("any_prop", "any");
    obj = new MyClass;
    expect (obj.any_prop).toBeUndefined ();
    obj.any_prop = nit.object ({ a: 3 });
    expect (obj.any_prop).toEqual ({ a: 3 });
    expect (obj.any_prop).toBeInstanceOf (nit.object);
    obj.any_prop = "str";
    expect (obj.any_prop).toBe ("str");

    MyClass.method ("i_method", function ()
    {
        return "i_method";
    });
    obj = new MyClass;
    expect (obj.i_method ()).toBe ("i_method");

    nit.Object.registerTypeParser (new nit.Object.PrimitiveTypeParser ("date", undefined, function (v) { return v instanceof Date; }));
    MyClass.property ("i_date", "date");
    obj = new MyClass;
    expect (obj.i_date).toBeUndefined ();
    expect (() => obj.i_date = "str").toThrow (/should be a date/);
    obj.i_date = new Date ();
    expect (obj.i_date).toBeInstanceOf (Date);

    MyClass.categorize ();
    expect (nit.defineMyClass).toBeInstanceOf (Function);
    let MySubclass2 = nit.defineMyClass ("MySubclass2");
    expect (nit.getSuperclass (MySubclass2)).toBe (MyClass);

    MyClass.categorize ("classes");
    let MyNewSubclass = nit.defineMyClass ("MyNewSubclass");
    expect (nit.NS.classes.MyNewSubclass).toBeInstanceOf (Function);

    nit.ns.export ();
    MyNewSubclass.categorize ("c2");
    let MySubSubclass = global.classes.defineMyNewSubclass ("MySubSubclass");
    expect (MySubSubclass.name).toBe ("c2.MySubSubclass");

    MyClass.defaults ("int_prop", 300);
    obj = new MyClass;
    expect (obj.int_prop).toBe (300);

    MyClass.defaults (
    {
        str_prop: "my string",
        bool_prop: true
    });

    obj = new MyClass;
    expect (obj.str_prop).toBe ("my string");
    expect (obj.bool_prop).toBe (true);

    MyClass.do (function (cls)
    {
        expect (cls).toBe (MyClass);
    });

    expect (MyClass.serialize (undefined)).toBe ("<undefined>");
    expect (MyClass.serialize ({ a: 3 })).toBe ('{"a":3}');

    expect (MyClass.getProperties (MyClass.prototype).map (p => p.name))
        .toEqual (
        [
            'name',
            'str_prop',
            'int_prop',
            'bool_prop',
            'object_prop',
            'any_prop',
            'i_date'
        ]);

    expect (MyClass.getProperties (obj).map (p => p.name))
        .toEqual (
        [
            'name',
            'str_prop',
            'int_prop',
            'bool_prop',
            'object_prop',
            'any_prop',
            'i_date'
        ]);

    expect (MyClass.buildConstructorParams ({}, [], MyClass.getProperties (obj)))
        .toEqual (
        {
            "name": "my_name",
            "any_prop": undefined,
            "bool_prop": true,
            "i_date": undefined,
            "int_prop": 300,
            "object_prop": {},
            "str_prop": "my string"
        });

    nit.Object.registerTypeParser (new nit.Object.PrimitiveTypeParser ("sqldate", () => new Date, function (v, vv) { vv = new Date (v); return isNaN (vv) ? undefined: vv; }));
    MyClass.property ("dateCreated", "sqldate");

    expect (new MyClass ().dateCreated).toBeInstanceOf (Date);

    MyClass.property ("number_prop", "number");
    obj = new MyClass;
    expect (obj.number_prop).toBe (0);
    expect (() => obj.number_prop = "str").toThrow (/should be a number/);

    function Data ()
    {
        this.type = "string";
        this.value = "test";
    }

    MyClass.property ("obj_prop", "object");
    obj = new MyClass;
    expect (obj.obj_prop).toBeInstanceOf (nit.object);

    obj.obj_prop = new Data ();
    expect (obj.obj_prop).toEqual ({ type: "string", value: "test" });
    obj.obj_prop = new Date;
    expect (obj.obj_prop).toEqual ({});
    expect (() => obj.obj_prop = "str").toThrow (/should be an object/);


    MyClass.property ("func_prop", "function");
    obj = new MyClass;
    expect (obj.func_prop).toBeUndefined ();
    obj.func_prop = nit.noop;
    expect (obj.func_prop).toBe (nit.noop);
    expect (() => obj.func_prop = "str").toThrow (/should be a function/);


});


test ("nit.Object.buildConstructorParams ()", () =>
{
    let Copy = nit.Object.defineSubclass ("commands.Copy")
        .property ("<source...>", "string")
        .property ("[target]", "string")
        .property ("chmod", "string")
    ;

    let obj = new Copy ("a.txt", "b.txt", "d.txt", { chmod: "u+x" });

    expect (nit.clone (obj)).toEqual (
    {
        source: ["a.txt", "b.txt"],
        target: "d.txt",
        chmod: "u+x"
    });

    obj = new Copy ("a.txt", "b.txt");

    expect (nit.clone (obj)).toEqual (
    {
        source: ["a.txt"],
        target: "b.txt",
        chmod: ""
    });

    obj = new Copy ("a.txt");

    expect (nit.clone (obj)).toEqual (
    {
        source: ["a.txt"],
        target: "",
        chmod: ""
    });

    expect (() =>
    {
        nit.Object
            .defineSubclass ("commands.Move")
            .property ("<source...>", "string")
            .property ("<target...>", "string");

    }).toThrow (/only one positional variadic argumen/i);

    expect (() =>
    {
        nit.Object
            .defineSubclass ("commands.Move")
            .property ("[source]", "string")
            .property ("<target...>", "string");

    }).toThrow (/optional positional.*cannot be followed by a required/i);

    let Move = nit.Object
            .defineSubclass ("commands.Move")
            .property ("<source>", "string")
            .property ("<target>", "string")
    ;

    expect (() => new Move ()).toThrow (/source.*required/);
    expect (() => new Move ("a")).toThrow (/target.*required/);
    expect (new Move ("a", "b")).toBeInstanceOf (Move);
});


test ("nit.Object.invokeConstructor ()", () =>
{
    let userConstructed = false;
    let User = nit.Object.defineSubclass ("nit.User")
        .property ("email")
        .construct (function (email) // eslint-disable-line no-unused-vars
        {
            userConstructed = true;
        })
    ;

    nit.User.defineSubclass ("nit.Employee")
        .property ("no")
    ;

    expect ((new User ({ email: undefined })).email).toBe ("");

    let userPassedToPhone;
    let Phone = nit.Object.defineSubclass ("nit.Phone")
        .m ("error.invalid_phone_number", "The phone number is invalid")
        .property ("<user>", "nit.User")
        .construct (function (user)
        {
            if (user instanceof User)
            {
                userPassedToPhone = true;
            }
        })
        .method ("trigger", function ()
        {
            this.throw ("error.invalid_phone_number");
        })
    ;

    try
    {
        nit.noop (new Phone ([3, 4]));
    }
    catch (e)
    {
        expect (e.context.source).toBeInstanceOf (Phone);
    }

    var myPhone;

    try
    {
        myPhone = new Phone (new User ());
        myPhone.trigger ();
    }
    catch (e)
    {
        expect (e.context.source).toBe (myPhone);
        expect (e.message).toBe ("The phone number is invalid");
    }

    expect (() => new Phone (nit.object ())).toThrow (/property 'user' is required/);
    expect (() => new Phone ([3, 4])).toThrow (/should be an instance of nit.User/);
    expect (new Phone (9).toPojo ()).toEqual ({ user: { email: "" } });
    expect (new Phone (new User ({ email: "a@b.com" })).user.email).toBe ("a@b.com");
    expect (new Phone (nit.object ({ "@class": "nit.User", email: "a@b.com" })).user.email).toBe ("a@b.com");
    expect (new Phone (nit.object ({ "@class": "nit.Employee", no: "11111" })).user.no).toBe ("11111");
    expect (() => new Phone (nit.object ({ "@class": "nit.Person", no: "11111" }))).toThrow (/should be an instance/);
    expect (userConstructed).toBe (true);
    expect (userPassedToPhone).toBe (true);
});


test ("nit.Object.ITypeParser ()", () =>
{
    expect (nit.Object.ITypeParser ()).toBeUndefined ();
    expect ((new nit.Object.ITypeParser).supports ()).toBe (false);
    expect ((new nit.Object.ITypeParser).defval).toBeUndefined ();
    expect ((new nit.Object.ITypeParser).cast ()).toBeUndefined ();
});


test ("nit.Object.ClassTypeParser ()", () =>
{
    expect (nit.Object.ITypeParser ()).toBeUndefined ();
    expect ((new nit.Object.ITypeParser).supports ()).toBe (false);
    expect ((new nit.Object.ITypeParser).defval).toBeUndefined ();
    expect ((new nit.Object.ITypeParser).cast ()).toBeUndefined ();
});


test ("nit.Object.t ()", () =>
{
    nit.Object.m ("info.help", "This is the help message.");
    expect (nit.Object.t ("info.help")).toBe ("This is the help message.");
});


test ("nit.Object.registerInnerClass ()", () =>
{
    function B () {}
    nit.Object.registerInnerClass ("B", B);
    expect (nit.Object.B).toBeInstanceOf (Function);
    expect (B.name).toBe ("nit.Object.B");

    function C () {}
    nit.Object.registerInnerClass (C);
    expect (C.name).toBe ("nit.Object.C");

    expect (() => nit.Object.registerInnerClass ("", C)).toThrow (/inner.*name is required/);
});


test ("nit.Object.defineInnerClass ()", () =>
{
    expect (() => nit.Object.defineInnerClass ("DD", "D")).toThrow (/superclass 'D'.*not defined/);

    function D () {}

    nit.registerClass (D);
    nit.Object.defineInnerClass ("DD", "D")
    expect (nit.getSuperclass (nit.Object.DD)).toBe (D);
    expect (nit.CLASSES["nit.Object.DD"]).toBe (nit.Object.DD);

    nit.Object.defineInnerClass ("localDd", "D", true);
    expect (nit.CLASSES["nit.Object.localDd"]).toBeUndefined ();
});


test ("nit.Object.staticGetter ()", () =>
{
    nit.Object.staticGetter ("now", function ()
    {
        return new Date ();
    });

    expect (nit.Object.now).toBeInstanceOf (Date);
});


test ("nit.Object.staticMemo ()", () =>
{
    nit.Object.staticMemo ("createdAt", function ()
    {
        return new Date ();
    });

    let createAt = nit.Object.createAt;
    expect (nit.Object.createAt).toBe (createAt);
});


test ("nit.Object.invokeParentStaticMethod ()", () =>
{
    let parentMethodCalled = false;
    let Parent = nit.Object.defineSubclass ("Parent")
        .staticMethod ("methodA", function ()
        {
            parentMethodCalled = true;

            return this.invokeParentStaticMethod ("methodA");
        })
    ;

    let childMethodCalled = false;
    let Child = Parent.defineSubclass ("Child")
        .staticMethod ("methodA", function ()
        {
            childMethodCalled = true;
            this.invokeParentStaticMethod ("methodA");
        })
    ;

    Child.methodA ();
    expect ([parentMethodCalled, childMethodCalled]).toEqual ([true, true]);
    expect (Parent.methodA ()).toBeUndefined ();
});


test ("nit.Object.invokeParentMethod ()", () =>
{
    let parentMethodCalled = false;
    let Parent = nit.Object.defineSubclass ("Parent")
        .method ("methodB", function ()
        {
            parentMethodCalled = true;
            return Parent.invokeParentMethod (this, "methodB");
        })
    ;

    let childMethodCalled = false;
    let Child = Parent.defineSubclass ("Child")
        .method ("methodB", function ()
        {
            childMethodCalled = true;
            Child.invokeParentMethod (this, "methodB");
        })
    ;

    let child = new Child;
    child.methodB ();
    expect ([parentMethodCalled, childMethodCalled]).toEqual ([true, true]);
});


test ("nit.Object.memo ()", () =>
{
    nit.Object.memo ("createdAt", function ()
    {
        return new Date ();
    });

    let obj = new nit.Object;
    let createAt = obj.createAt;
    expect (obj.createAt).toBe (createAt);
});


test ("nit.Object.categorize ()", () =>
{
    let Task = nit.Object.defineSubclass ("nit.Task").categorize ();

    expect (nit.defineTask).toBeInstanceOf (Function);
    expect (() => nit.defineTask ("Subtask", "Suptask")).toThrow (/superclass.*not defined/);

    nit.Object.defineSubclass ("nit.Suptask");
    expect (() => nit.defineTask ("Subtask", "nit.Suptask")).toThrow (/superclass.*not a subclass/);
});


test ("nit.Object.ClassTypeParser.cast ()", () =>
{
    let Shape = nit.Object.defineSubclass ("Shape");
    let parser = new nit.Object.ClassTypeParser ()

    expect (() => parser.cast ("@Shape")).toThrow (/class name cannot be empty/);
    expect (() => parser.cast ("@Shape", "Circle")).toThrow (/class.*circle.*not defined/i);

    let Circle = Shape.defineSubclass ("Circle");
    expect (parser.cast ("@Circle", "Shape")).toBeInstanceOf (Shape);

});


test ("nit.Object.superclass", () =>
{
    expect (Circle.superclass).toBe (Shape);
});


test ("nit.Object.require ()", () =>
{
    expect (() => nit.Object.require ("Nothing")).toThrow (/dependency.*was not defined/);
    expect (nit.Object.require ("Shape")).toBe (nit.Object);
});


test ("nit.Object.getProperties ()", () =>
{
    let Circle = nit.lookupClass ("Circle")
        .property ("<radius>")
    ;

    expect (Circle.getProperties ()[0].name).toBe ("radius");
    expect (Circle.getProperties (null, nit.Object.Property)[0].name).toBe ("radius");
    expect (() => Circle.getProperties (null, "Opt")).toThrow (/property type.*invalid/);
});


test ("nit.Object.createTypeCheckedFunction ()", () =>
{
    expect (() => nit.Object.createTypeCheckedMethod ("sum", function (Method)
        {
            Method
                .property ("<a>", "integer")
                .property ("<b>", "integer")
            ;
        })
        ).toThrow (/invoke method.*not defined/);

    let sum = nit.Object.createTypeCheckedMethod ("sum", function (Method)
    {
        Method
            .property ("<a>", "integer")
            .property ("<b>", "integer")
            .invoke (function (a, b)
            {
                return a + b;
            })
        ;
    });

    expect (sum (1, 2)).toBe (3);
    expect (() => sum (1, "ab")).toThrow (/should be an integer/);
});


test ("nit.Object.staticTypeCheckedMethod ()", () =>
{
    nit.Object.staticTypeCheckedMethod ("mul", function (Method)
    {
        Method
            .property ("<a>", "integer")
            .property ("<b>", "integer")
            .invoke (function (a, b)
            {
                return a * b;
            })
        ;
    });

    expect (nit.Object.mul (2, 3)).toBe (6);
});


test ("nit.Object.typeCheckedMethod ()", () =>
{
    nit.Object.typeCheckedMethod ("div", function (Method)
    {
        Method
            .property ("<a>", "integer")
            .property ("<b>", "integer")
            .invoke (function (a, b)
            {
                return a / b;
            })
        ;
    });

    let obj = new nit.Object;

    expect (obj.div (10, 5)).toBe (2);
});


test ("nit.Object.assign ()", () =>
{
    let values = {
        email: "ab@c.d.com",
        firstname: "john"
    };

    let user = new nit.User;

    nit.User.assign (user, values);
    expect (nit.keys (user)).toEqual (["createdAt", "email"]);

    nit.User.assign (user);
    expect (nit.keys (user)).toEqual (["createdAt", "email"]);

    nit.User.assign (user, {});
    expect (nit.keys (user)).toEqual (["createdAt", "email"]);

    nit.User.assign (user, { k: "v" });
    expect (nit.keys (user)).toEqual (["createdAt", "email"]);
});


test ("nit.Object.getter ()", () =>
{
    nit.Object.getter ("now", true, true, function ()
    {
        return new Date ();
    });

    let obj = new nit.Object;
    expect (obj.now).toBeInstanceOf (Date);
});


test ("nit.Object.defaults ()", () =>
{
    expect (nit.User.defaults ()).toEqual ({});

    nit.User.defaults ("k", "v");
    expect (nit.User.defaults ()).toEqual ({ k: "v" });

    nit.User.defaults ({ a: "b" });
    expect (nit.User.defaults ()).toEqual ({ k: "v", a: "b" });

});


test ("nit.Object.buildParam ()", async () =>
{
    nit.User.property ("orgIds...", "integer");

    let field = nit.find (nit.User.getProperties (), "name", "orgIds");
    let user = new nit.User;

    expect (nit.Object.buildParam (user, field, {})).toEqual ([]);
    expect (nit.Object.buildParam (user, field, { orgIds: [3, 4] })).toEqual ([3, 4]);

    nit.User.property ("info", "string");

    nit.config ("nit.User.info", { "": { tpl: "email: {{email}}" } });
    field = nit.find (nit.User.getProperties (), "name", "info");
    expect (nit.Object.buildParam (user, field, {})).toBe ("email: ");

    nit.registerArgExpander ("remoteData", async function ()
    {
        await nit.sleep (10);

        return "lastLogin: 2022-01-01";
    });

    nit.config ("nit.User.info", { "": { remoteData: "someurl" } });
    expect (await nit.Object.buildParam (user, field, {})).toBe ("lastLogin: 2022-01-01");
});


test ("nit.Object.buildConstructorParams ()", async () =>
{
    let props = nit.User.getProperties ();
    let user = new nit.User;

    expect (await nit.User.buildConstructorParams (user, { "info..remoteData": "someurl" }, props))
        .toEqual (
        {
            email: "",
            info: "lastLogin: 2022-01-01",
            orgIds: []
        });

    let prepareCalled = false;

    nit.User.prepareConstructorParams (function (params, obj)
    {
        prepareCalled = true;
    });

    await nit.User.buildConstructorParams (user, { "info..remoteData": "someurl" }, props, true);
    expect (prepareCalled).toBe (true);
});


test ("nit.Object.constructObject ()", () =>
{
    let props = nit.User.getProperties ();
    let preConstructCalled = false;
    let postConstructCalled = false;

    nit.CONFIG = {};

    nit.User
        .preConstruct (function ()
        {
            preConstructCalled = true;
        })
        .postConstruct (function ()
        {
            postConstructCalled = true;
        })
    ;

    let user = new nit.User;
    expect (preConstructCalled).toBe (true);
    expect (postConstructCalled).toBe (true);
});


test ("nit.Object.PrimitiveTypeParser", () =>
{
    let parsers = nit.index (nit.Object.TYPE_PARSERS, "type");

    expect (parsers.string.cast (undefined)).toBe ("");
});

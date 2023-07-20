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


    let emailProp = nit.Object.Property.new (MyClass, "<email>", "string");
    let fileProp = nit.Object.Property.new (MyClass, "<file...>", "string");
    let funcProp = nit.Object.Property.new (MyClass, "func", "function");
    let dateProp = nit.Object.Property.new (MyClass, "date", "Date", () => new Date);

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
    expect (() => nit.Object.Property.new (MyClass, "<>", "string")).toThrow (/name.*required/);
    expect (() => nit.Object.Property.new (MyClass, "arg", "array")).toThrow (/property.*assigned.*invalid type/);

    expect (emailProp.get.call (obj = new nit.Object)).toBe ("");
    expect (nit.clone.deep (obj)).toEqual (expect.objectContaining ({ $__email: "" }));
    expect (emailProp.get.call (obj)).toBe ("");

    expect (() => emailProp.set.call (obj)).toThrow (/email.*required/);
    expect (() => emailProp.set.call (obj, [1, 2])).toThrow (/email.*should be.*string/);
    expect (() => emailProp.set.call (obj, {a: 3})).toThrow (/email.*should be.*string/);

    emailProp.set.call (obj, 3);
    expect (obj.$__email).toBe ("3");

    expect (emailProp.set.call (obj, "a@b.com")).toBe ("a@b.com");
    expect (fileProp.set.call (obj, ["a.txt", "b.txt"])).toEqual (["a.txt", "b.txt"]);

    expect (funcProp.set.call (obj, undefined)).toBeUndefined ();
    expect (nit.clone.deep (obj)).toEqual (expect.objectContaining (
    {
      '$__email': 'a@b.com',
      '$__file': ['a.txt', 'b.txt'],
      '$__func': undefined
    }));

    nit.Object.defineProperty (obj, "age", "integer", 10);
    expect (Object.getOwnPropertyDescriptor (obj, "age").get[nit.Object.kProperty]).toMatchObject ({ array: false, name: "age", defval: 10 });

    MyClass.constant ("MAX_SIZE", 20);
    MyClass.constant ("CONFIG", { a: 1 }, true);

    MyClass.CONFIG.a = 10;
    expect (MyClass.CONFIG.a).toBe (1);
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
    let MySubclass2 = nit.defineMyClass ("MySubclass2", true);
    expect (nit.getSuperclass (MySubclass2)).toBe (MyClass);
    expect (nit.CLASSES.MySubclass2).toBeUndefined ();

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
    expect (obj.obj_prop).toBeInstanceOf (Date);
    expect (() => obj.obj_prop = "str").toThrow (/should be an object/);


    MyClass.property ("func_prop", "function");
    obj = new MyClass;
    expect (obj.func_prop).toBeUndefined ();
    obj.func_prop = nit.noop;
    expect (obj.func_prop).toBe (nit.noop);
    expect (() => obj.func_prop = "str").toThrow (/should be a function/);


});


test ("nit.Object.staticLifecycleMethod ()", () =>
{
    const A = nit.defineClass ("AS")
        .staticLifecycleMethod ("run",
            function ()
            {
                A.implCalled = true;
                A[A.kRun] ();

                return true;
            }
            ,
            function ()
            {
                A.hookCalled = true;
            }
        )
    ;

    expect (A.run ()).toBe (true);
    expect (A.implCalled).toBe (true);
    expect (A.hookCalled).toBe (true);

    const B = nit.defineClass ("BS")
        .staticLifecycleMethod ("run",
            function ()
            {
                B.implCalled = true;
                B[B.kRun] ();

                return true;
            }
            ,
            true
        )
    ;

    expect (() => B.run ()).toThrow (/not implemented/);

    const C = nit.defineClass ("CS")
        .staticLifecycleMethod ("run", null, function ()
        {
            C.hookCalled = true;

            return true;
        })
    ;

    C.onRun (() => 10);

    expect (C.run ()).toBe (10);
    expect (C.hookCalled).toBeUndefined ();

    const D = nit.defineClass ("DS")
        .staticLifecycleMethod ("run")
    ;

    expect (D.run ()).toBe (D);
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
        .onConstruct (function (email) // eslint-disable-line no-unused-vars
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
        .onConstruct (function (user)
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
        expect (e.context.owner).toBeInstanceOf (Phone);
    }

    var myPhone;

    try
    {
        myPhone = new Phone (new User ());
        myPhone.trigger ();
    }
    catch (e)
    {
        expect (e.context.owner).toBe (myPhone);
        expect (e.message).toBe ("The phone number is invalid");
    }

    expect (() => new Phone (nit.object ())).toThrow (/property 'user' is required/);
    expect (() => new Phone ([3, 4])).toThrow (/should be an instance of nit.User/);
    expect (() => new Phone (9)).toThrow (/should be an instance of nit.User/);
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
    expect ((new nit.Object.ClassTypeParser).supports ()).toBe (false);
    expect ((new nit.Object.ClassTypeParser).defval).toBeUndefined ();
    expect ((new nit.Object.ClassTypeParser).cast ()).toBeUndefined ();
    expect ((new nit.Object.ClassTypeParser).cast ("@nit.Class", "nit.Class")).toBeInstanceOf (nit.Class);
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


test ("nit.Object.defineNamespace ()", () =>
{
    const A = nit.defineClass ("A");
    const B = nit.defineClass ("B", "A");

    A.defineNamespace ("apis");

    A.apis.DoThis = nit.createFunction ("DoThis");
    B.apis.DoThat = nit.createFunction ("DoThat");

    expect (nit.keys (A.apis)).toEqual (["DoThis"]);
    expect (nit.keys (B.apis)).toEqual (["DoThis", "DoThat"]);
});


test ("nit.Object.defineInnerClass ()", () =>
{
    expect (() => nit.Object.defineInnerClass ("DD", "D")).toThrow (/superclass 'D'.*not defined/);

    function D () {}

    nit.registerClass (D);
    nit.Object.defineInnerClass ("DD", "D");
    expect (nit.getSuperclass (nit.Object.DD)).toBe (D);
    expect (nit.CLASSES["nit.Object.DD"]).toBe (nit.Object.DD);

    nit.Object.defineInnerClass ("localDd", "D", true);
    expect (nit.CLASSES["nit.Object.localDd"]).toBeUndefined ();

    const EE = nit.defineClass ("EE");
    const FF = nit.defineClass ("FF", "EE");

    EE.defineNamespace ("helpers");
    EE.defineInnerClass ("Helper", "nit.Class", "helpers");

    EE.defineHelper ("HelperOne");
    FF.defineHelper ("HelperTwo");

    expect (EE.helpers.HelperOne.name).toBe ("EE.helpers.HelperOne");
    expect (FF.helpers.HelperTwo.name).toBe ("FF.helpers.HelperTwo");

    expect (nit.keys (EE.helpers)).toEqual (["HelperOne"]);
    expect (nit.keys (FF.helpers)).toEqual (["HelperOne", "HelperTwo"]);

    EE.defineInnerClass ("Model", "nit.Class", "models");
    EE.defineModel ("One");
    FF.defineModel ("Two");
    expect (nit.keys (EE.models)).toEqual (["One", "Two"]);
    expect (nit.keys (FF.models)).toEqual (["One", "Two"]);

    EE.defineInnerClass ("Response", false, true);
    EE.defineResponse ("RE");
    FF.defineResponse ("RF");
    expect (EE.RE).toBeInstanceOf (Function);
    expect (EE.RF).toBeUndefined ();
    expect (FF.RE).toBeInstanceOf (Function);
    expect (FF.RF).toBeInstanceOf (Function);
});


test ("nit.Object.staticGetter ()", () =>
{
    nit.Object.staticGetter ("now", function ()
    {
        return new Date ();
    });

    expect (nit.Object.now).toBeInstanceOf (Date);

    const B = nit.defineClass ("B")
        .field ("<val>", "string")
    ;

    const A = nit.defineClass ("A")
        .staticProperty ("b", "B")
        .property ("b", "B")
        .staticGetter ("bVal", "b.val")
        .getter ("bVal", "b.val")
    ;

    A.b = new B (9);
    expect (A.bVal).toBe ("9");

    let a = new A;
    a.b = new B (10);
    expect (a.bVal).toBe ("10");
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


test ("nit.Object.staticAbstractMethod ()", () =>
{
    const A = nit.defineClass ("A")
        .staticAbstractMethod ("doSomething")
    ;

    expect (() => A.doSomething ()).toThrow (/static method.*not implemented/);
});


test ("nit.Object.abstractMethod ()", () =>
{
    const A = nit.defineClass ("A")
        .abstractMethod ("doSomething")
    ;

    expect (() => new A ().doSomething ()).toThrow (/instance method.*not implemented/);
});


test ("nit.listSubclassesOf ()", () =>
{
    expect (nit.listSubclassesOf (nit.Constraint).length).toBeGreaterThanOrEqual (4);
});


test ("nit.Object.lifecycleMethod ()", () =>
{
    let Service = nit.defineClass ("Service", true)
        .lifecycleMethod ("start", function ()
        {
            Service.startCb = Service[Service.kStart];
        })
        .lifecycleMethod ("stop", function ()
        {
            Service[Service.kStop].call (this);

        }, true)
        .lifecycleMethod ("run", null, function ()
        {
            Service.runCbInvoked = true;
        })
        .lifecycleMethod ("noop")
    ;

    let service = new Service;

    service.start ();
    service.run ();

    expect (Service.startCb).toBeUndefined ();
    expect (Service.runCbInvoked).toBe (true);
    expect (service.noop ()).toBe (service);
    expect (() => service.stop ()).toThrow (/lifecycle.*stop.* was not implemented/);
});


test ("nit.Object.toPojo ()", () =>
{
    expect (nit.Object.toPojo (null)).toBeUndefined ();
    expect (nit.Object.toPojo (3)).toBeUndefined ();

    let now = new Date ();

    const Permission = nit.defineClass ("Permission")
        .field ("<type>", "string")
    ;

    const Owner = nit.defineClass ("Owner")
        .field ("<username>", "string")
        .field ("[permissions...]", "Permission")
        .property ("updatedAt", "date")
    ;

    const Doc = nit.defineClass ("Doc")
        .field ("<id>", "string")
        .field ("owner", "Owner")
        .property ("version", "string")
    ;

    let owner = new Owner ("Somebody", new Permission ("read"), new Permission ("write"));
    owner.updatedAt = now;
    owner.permissions[0].MARK = "marked";

    let doc = new Doc ("12345");
    doc.owner = owner;
    doc.version = "9a38b";

    expect (doc.toPojo ()).toEqual (
    {
        id: "12345",
        owner:
        {
            username: "Somebody",
            permissions: [{ type: "read" }, { type: "write" }]
        }
    });

    expect (doc.toPojo (true).owner).toBeInstanceOf (Owner);
    expect (owner.toPojo (true).permissions[0].MARK).toBe ("marked");
    expect (owner.toPojo ().permissions[0].MARK).toBeUndefined ();

    const Capital = nit.defineClass ("Capital")
        .field ("<name>", "string")
        .field ("country", "Country")
    ;

    const Country = nit.defineClass ("Country")
        .field ("<name>", "string")
        .field ("capital", "Capital")
    ;

    let country = new Country ("Taiwan");
    let capital = new Capital ("Taipei");

    capital.country = country;
    country.capital = capital;

    expect (capital.toPojo ()).toEqual ({ name: "Taipei", country: { name: "Taiwan", capital: null } });
});


test ("nit.Object.mixin ()", () =>
{
    const Mix = nit.Object.defineSubclass ("mixins.Mix")
        .staticMethod ("mixA", function () {})
        .staticMethod ("mixB", function () {})
        .method ("mixC", function () {})
        .method ("mixD", function () {})
    ;

    const Sub = nit.Object.defineSubclass ("Sub")
        .mixin (Mix, ["mixA", "mixC"])
    ;

    expect (Sub.mixA).toBeUndefined ();
    expect (Sub.mixB).toBeInstanceOf (Function);
    expect (Sub.prototype.mixC).toBeUndefined ();
    expect (Sub.prototype.mixD).toBeInstanceOf (Function);

    const Sub2 = nit.Object.defineSubclass ("Sub")
        .mixin ("Mix")
    ;

    expect (Sub2.mixA).toBeInstanceOf (Function);
    expect (Sub2.mixB).toBeInstanceOf (Function);
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
    nit.Object.defineSubclass ("nit.Task").categorize ();

    expect (nit.defineTask).toBeInstanceOf (Function);
    expect (() => nit.defineTask ("Subtask", "Suptask")).toThrow (/superclass.*not defined/);

    nit.Object.defineSubclass ("nit.Suptask");
    expect (() => nit.defineTask ("Subtask", "nit.Suptask")).toThrow (/superclass.*not a subclass/);
});


test ("nit.Object.ClassTypeParser.cast ()", () =>
{
    let Shape = nit.Object.defineSubclass ("Shape");
    let parser = new nit.Object.ClassTypeParser ();

    expect (() => parser.cast ("@Shape")).toThrow (/class name cannot be empty/);
    expect (() => parser.cast ("@Shape", "Circle")).toThrow (/class.*circle.*not defined/i);

    let Circle = Shape.defineSubclass ("Circle");
    expect (parser.cast ("@Circle", "Shape")).toBeInstanceOf (Shape);
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


test ("nit.Object.assignStatic ()", () =>
{
    const AssignStatic = nit.defineClass ("AssignStatic")
        .staticProperty ("a", "string")
    ;

    let values = {
        a: "ab@c.d.com",
        b: "john"
    };

    AssignStatic.assignStatic (values);

    expect (AssignStatic.a).toEqual ("ab@c.d.com");
    expect (AssignStatic.b).toBeUndefined ();
});



test ("nit.Object.getter ()", () =>
{
    nit.Object
        .getter ("now", true, true, function ()
        {
            return new Date ();
        })
    ;

    let A = nit.Object.defineSubclass ("A")
        .property ("obj", "object")
        .getter ("mesg", "obj.mesg")
    ;

    let obj = new nit.Object;

    expect (obj.now).toBeInstanceOf (Date);

    let a = new A;
    a.obj = { mesg: function (m) { this.lastMesg = m; } };
    a.mesg ("hello");
    expect (a.obj.lastMesg).toBe ("hello");
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
    nit.User.property ("patterns...", "string", "*");

    let field = nit.find (nit.User.getProperties (), "name", "orgIds");
    let user = new nit.User;

    expect (nit.Object.buildParam (user, field, {})).toEqual ([]);
    expect (nit.Object.buildParam (user, field, { orgIds: [3, 4] })).toEqual ([3, 4]);
    expect (nit.Object.buildParam (user, field, { orgIds: 3 })).toEqual ([3]);

    field = nit.find (nit.User.getProperties (), "name", "patterns");
    expect (nit.Object.buildParam (user, field, {})).toEqual (["*"]);

    nit.User.property ("info", "string");

    nit.config ("nit.User.info", { "": { tpl: "email: {{email}}" } });
    field = nit.find (nit.User.getProperties (), "name", "info");
    expect (nit.Object.buildParam (user, field, { email: "a@b.com" })).toBe ("email: a@b.com");

    nit.registerArgExpander ("remoteData", async function ()
    {
        await nit.sleep (10);

        return "lastLogin: 2022-01-01";
    });

    nit.config ("nit.User.info", { "": { remoteData: "someurl" } });
    expect (await nit.Object.buildParam (user, field, {})).toBe ("lastLogin: 2022-01-01");


    nit.defineClass ("AsyncB")
        .field ("time")
        .onConstruct (async function ()
        {
            await nit.sleep (10);
            this.time = new Date ().toISOString ();
        })
    ;

    const AsyncA = nit.defineClass ("AsyncA")
        .field ("ab", "AsyncB", { defval: "@AsyncB" })
    ;

    let aa = await new AsyncA;

    expect (aa.ab.time).toMatch (/^\d{4}-/);
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
            orgIds: [],
            patterns: ["*"]
        });
});


test ("nit.Object.buildConstructorParams () - varargs grouping", async () =>
{
    let FilterOne = nit.defineClass ("FilterOne")
        .field ("<keys...>", "string")
        .field ("[caseInsensitive]", "boolean")
    ;

    expect (new FilterOne ("a", "b").toPojo ()).toEqual ({ keys: ["a", "b"], caseInsensitive: false });

    let FilterTwo = nit.defineClass ("FilterTwo")
        .field ("<keys...>", "string")
        .field ("[value]", "string")
    ;

    expect (new FilterTwo ("a", "b", "c").toPojo ()).toEqual ({ keys: ["a", "b"], value: "c" });
});


test ("nit.Object.constructObject ()", () =>
{
    let preConstructCalled = false;
    let postConstructCalled = false;

    nit.CONFIG = {};

    nit.User
        .onPreConstruct (function ()
        {
            preConstructCalled = true;
        })
        .onPostConstruct (function ()
        {
            postConstructCalled = true;
        })
    ;

    let user = new nit.User; // eslint-disable-line no-unused-vars
    expect (preConstructCalled).toBe (true);
    expect (postConstructCalled).toBe (true);
});


test ("nit.Object.PrimitiveTypeParser", () =>
{
    let parsers = nit.index (nit.Object.TYPE_PARSERS, "type");

    expect (parsers.string.cast (undefined)).toBe ("");
    expect (parsers.pojo.cast ({ a: 1 })).toEqual ({ a: 1 });
    expect (parsers.pojo.cast ("abc")).toBeUndefined ();
    expect (parsers.pojo.defval ()).toEqual ({});
});


test ("nit.Object.onDefineSubclass ()", () =>
{
    const AA = nit.defineClass ("AA")
        .onDefineSubclass (function (Sub)
        {
            AA.subclasses = [Sub];
        })
    ;

    const BB = AA.defineSubclass ("BB");

    expect (AA.subclasses).toEqual ([BB]);
});


test ("nit.Object.simpleName", () =>
{
    expect (nit.Object.simpleName).toBe ("Object");
});


test ("nit.Object.properties", () =>
{
    const AP = nit.Object.defineSubclass ("AP")
        .property ("<name>", "string")
        .property ("email", "string")
    ;

    expect (AP.properties.length).toBe (2);
    expect (AP.properties[0].name).toBe ("name");
    expect (AP.properties[1].name).toBe ("email");
    expect (AP.pargs.length).toBe (1);
    expect (AP.pargs[0].name).toBe ("name");
    expect (nit.keys (AP.pargMap)).toEqual (["name"]);
});


test ("nit.Object.extend ()", () =>
{
    const { Writable } = require ("stream");

    nit.registerClass ("Writable", Writable);

    const MyStream = nit.defineClass ("MyStream")
        .extend (Writable, nit.Class)
    ;

    expect (MyStream.method).toBeInstanceOf (Function);
    expect (MyStream.prototype.throw).toBeInstanceOf (Function);
});


test ("nit.Object.invalidateProperty ()", () =>
{
    let count = 1;

    const A = nit.defineClass ("A")
        .staticMemo ("count", function ()
        {
            return count++;
        })
    ;

    expect (A.count).toBe (1);
    expect (A.count).toBe (1);

    A.invalidateProperty ("count");
    expect (A.count).toBe (2);
    expect (A.count).toBe (2);
});


test ("nit.Object.invalidatePropertyCache ()", () =>
{
    let count = 1;
    const A = nit.defineClass ("A")
        .staticMemo ("count", function ()
        {
            return count++;
        })
        .field ("f1", "string")
        .field ("f2", "string")
    ;

    expect (A.count).toBe (1);
    expect (A.properties.length).toBe (2);
    expect (A.properties.length).toBe (2);

    A.field ("f3");
    expect (A.count).toBe (1);
    expect (A.properties.length).toBe (3);
    expect (A.properties.length).toBe (3);

    A.invalidatePropertyCache ("count");
    expect (A.count).toBe (2);
    expect (A.properties.length).toBe (3);
});


test ("nit.Object.ClassTypeParser.cast ()", () =>
{
    let parser = new nit.Object.ClassTypeParser;

    const A = nit.defineClass ("A");
    nit.defineClass ("B");

    expect (parser.cast (new A, "B")).toBeUndefined ();
    expect (parser.cast (new A, "A")).toBeInstanceOf (A);
});


test ("nit.Object.do ()", () =>
{
    const B = nit.defineClass ("B")
        .field ("<val>", "string")
    ;

    const A = nit.defineClass ("A")
        .staticProperty ("b", "B")
    ;

    A.b = new B (9);

    A.do ("b", b =>
    {
        expect (b).toBeInstanceOf (B);
        expect (b.val).toBe ("9");
    });
});


test ("nit.object.staticDelegate ()", () =>
{
    const A = nit.Object.defineSubclass ("A")
        .staticProperty ("target", "object")
        .staticDelegate ("prop", "target.prop")
        .staticDelegate ("prop2", "target.prop", true, true)
    ;

    A.target =
    {
        prop: "a"
    };

    expect (A.target.prop).toBe ("a");
    expect (A.prop).toBe ("a");

    A.prop = "b";
    expect (A.prop).toBe ("b");
});


test ("nit.object.delegate ()", () =>
{
    const A = nit.Object.defineSubclass ("A")
        .property ("target", "object")
        .delegate ("prop", "target.prop")
        .delegate ("prop2", "invalid.prop", true, true)
    ;

    let a = new A (
    {
        target:
        {
            prop: "a"
        }
    });

    expect (a.target.prop).toBe ("a");
    expect (a.prop).toBe ("a");

    a.prop = "b";
    expect (a.prop).toBe ("b");

    a.prop2 = 9;
    expect (a.prop2).toBeUndefined ();
});


test ("nit.Object.use ()", () =>
{
    nit.Object.use.parsers.splice (2);

    const B = nit.Object.defineSubclass ("test.B");
    const C = nit.Object.defineSubclass ("nit.tests.C");

    const A = nit.Object.defineSubclass ("A")
        .use ("test.B")
        .use ("nit:c", "tests")
        .use ("notfound")
    ;

    expect (A.B).toBe (B);
    expect (A.C).toBe (C);
    expect (A.notfound).toBeUndefined ();
});


test ("nit.Object.getClassChainProperty ()", () =>
{
    const CCA = nit.defineClass ("CCA")
        .staticProperty ("items...", "string")
        .staticProperty ("opt", "string?")
    ;

    const CCB = nit.defineClass ("CCB", "CCA")
    ;

    CCA.items = ["a1", "a2"];
    CCA.opt = "optval-a";
    CCB.items = ["b1"];

    expect (CCA.getClassChainProperty ("items", true)).toEqual (["a1", "a2"]);
    expect (CCA.getClassChainProperty ("items")).toBe ("a1");

    expect (CCA.getClassChainProperty ("opt", true)).toEqual (["optval-a"]);
    expect (CCA.getClassChainProperty ("opt")).toBe ("optval-a");

    expect (CCB.getClassChainProperty ("items", true)).toEqual (["b1", "a1", "a2"]);
    expect (CCB.getClassChainProperty ("items")).toBe ("b1");

    expect (CCB.getClassChainProperty ("opt", true)).toEqual (["optval-a"]);
    expect (CCB.getClassChainProperty ("opt")).toBe ("optval-a");
});

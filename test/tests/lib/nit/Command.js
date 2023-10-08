test ("nit.Command - command primitive type", () =>
{
    nit.require ("nit.Command");

    let parser = nit.Object.findTypeParser ("command");

    expect (parser).toBeInstanceOf (nit.Object.PrimitiveTypeParser);
    expect (parser.cast ("test-command")).toBe ("test-command");
});


test ("nit.Command - command primitive type", () =>
{
    const MyCommand = nit.defineCommand ("MyCommand");
    const MyClass = nit.defineClass ("MyClass")
        .field ("<fa>", "string")
        .field ("fb", "integer")
    ;

    MyCommand.Input.import (MyClass.fields);

    expect (MyCommand.Input.properties.length).toBe (2);
    expect (MyCommand.Input.propertyMap.fa.type).toBe ("string");
    expect (MyCommand.Input.propertyMap.fb.type).toBe ("integer");

});


test ("nit.Command.completers.Command.completeForType ()", () =>
{
    nit.require ("nit.Compgen");

    let comp = nit.Command.completers.Command;

    const A = nit.defineCommand ("TestCommand")
        .defineInput (Input =>
        {
            Input
                .option ("cmd1", "command")
                .option ("cmd2", "string")
            ;
        })
    ;

    let ctx = new nit.Compgen.Context ({ currentOption: A.Input.fieldMap.cmd1 });
    expect (comp.completeForType (ctx)).toEqual (expect.arrayContaining (["test", "lint"]));

    ctx = new nit.Compgen.Context ({ currentOption: A.Input.fieldMap.cmd2 });
    expect (comp.completeForType (ctx)).toBeUndefined ();
});


test ("nit.Command.describe ()", () =>
{
    const Test = nit.defineClass ("Test", "nit.Command")
        .describe ("Run tests.")
    ;

    expect (Test.DESCRIPTION).toBe ("Run tests.");
});


test ("nit.Command.help ()", async () =>
{
    const nit = await test.setupCliMode ("", "project-a", true);
    const TestCmd = nit.lookupCommand ("test-cmd");

    TestCmd.defaults ({ choice: "first choice" });

    expect (TestCmd.help ().build ()).toBe (`A test command.

Usage: nit test-cmd [file]

Options:

 [file]            file option

 -b, --base64      base64 option
 -c, --choice      choice option     [default: first choice]
 -d, --doc-ids...  docIds option
 -s, --service     service option`
);

    const NoArgs = nit.lookupCommand ("no-args");

    expect (NoArgs.help ().build ()).toBe (`Description not available.

Usage: nit no-args`
);

    const HelloWorld = nit.lookupCommand ("hello-world");

    HelloWorld.defaults ({ message: "hello!" });

    expect (HelloWorld.help ().build ()).toBe (`Description not available.

Usage: nit hello-world [message]

Options:

 [message]        The greeting message.  [default: hello!]

     --color      The message color.`
);

});


test ("nit.Command.Option", () =>
{
    const Test = nit.defineClass ("Test", "nit.Command");

    let option = new Test.Option ("paramA");

    expect (option.flag).toBe ("param-a");

    option = new Test.Option ("<paramB>");

    expect (option.helpSpec).toBe ("<param-b>");
});


test ("nit.Command.Input", () =>
{
    const Test = nit.defineClass ("Test", "nit.Command")
        .defineInput (function (Input)
        {
            Input
                .option ("paramA")
                .option ("boolOpt", "boolean")
                .option ("paramB")
                .option ("paramE", "boolean|integer", "The mixed type.")
            ;
        })
    ;

    const Input = Test.Input;

    expect (() => Input.option ("paramB", { shortFlag: "p" })).toThrow (/The short flag.*has been used/i);
    expect (Input.option ("paramC")).toBe (Input);
    expect (Input.option ("paramD", { shortFlag: "d" })).toBe (Input);

    expect (Input.getOptionByFlag ("param-a")).toBeInstanceOf (nit.Command.Option);
    expect (Input.getOptionByFlag ("param-f")).toBeUndefined ();

    expect (Input.getOptionByShortFlag ("p").flag).toBe ("param-a");
    expect (Input.getOptionByShortFlag ("u")).toBeUndefined ();

    expect (Input.isBooleanOption (Input.fieldMap.boolOpt)).toBe (true);
    expect (Input.isBooleanOption (Input.fieldMap.paramB)).toBe (false);
    expect (Input.isBooleanOption (Input.fieldMap.paramE)).toBe (true);
});


test ("nit.Command.Input.parseArgv ()", () =>
{
    nit.defineClass ("Location")
        .field ("<latitude>", "number")
        .field ("<longitude>", "number")
    ;

    const Test = nit.defineClass ("Test", "nit.Command")
        .defineInput (function (Input)
        {
            Input
                .option ("<paramA>")
                .option ("paramB")
                .option ("location", "Location")
            ;
        })
    ;

    expect (Test.Input.parseArgv ("a", { paramB: "b" })).toEqual ({ paramA: "a", paramB: "b" });
    expect (Test.Input.parseArgv ({ paramA: "a", paramB: "b" })).toEqual ({ paramA: "a", paramB: "b" });
    expect (Test.Input.parseArgv ({ paramA: "a", location: "{ latitude: 3.3, longitude: 4.4 }" })).toEqual ({ paramA: "a", location: { latitude: 3.3, longitude: 4.4 }});
});


test ("nit.Command.Input.fromArgv ()", () =>
{
    const Test = nit.defineClass ("Test", "nit.Command")
        .defineInput (function (Input)
        {
            Input
                .option ("[paramA]")
                .option ("boolOpt", "boolean")
                .option ("paramB", "integer", { shortFlag: "r" })
                .option ("paramD")
            ;
        })
    ;

    expect (Test.Input.fromArgv ()).toBeInstanceOf (Test.Input);

    expect (Test.Input.fromArgv (["value-a-positional"]).toPojo ()).toEqual (
    {
        boolOpt: false,
        paramA: "value-a-positional",
        paramB: 0,
        paramD: ""
    });

    expect (Test.Input.fromArgv (["--param-a", "value-a"]).toPojo ()).toEqual (
    {
        boolOpt: false,
        paramA: "value-a",
        paramB: 0,
        paramD: ""
    });

    expect (Test.Input.fromArgv (["--param-a", "value-a", "value-b"]).toPojo ()).toEqual (
    {
        boolOpt: false,
        paramA: "value-b",
        paramB: 0,
        paramD: ""
    });

    expect (Test.Input.fromArgv (["--boolOpt"]).toPojo ()).toEqual (
    {
        boolOpt: true,
        paramA: "",
        paramB: 0,
        paramD: ""
    });

    expect (Test.Input.fromArgv (["-b"]).toPojo ()).toEqual (
    {
        boolOpt: true,
        paramA: "",
        paramB: 0,
        paramD: ""
    });

    expect (Test.Input.fromArgv (["-b", false]).toPojo ()).toEqual (
    {
        boolOpt: false,
        paramA: "",
        paramB: 0,
        paramD: ""
    });

    expect (Test.Input.fromArgv (["-b=true"]).toPojo ()).toEqual (
    {
        boolOpt: true,
        paramA: "",
        paramB: 0,
        paramD: ""
    });

    expect (() => Test.Input.fromArgv (["-bz=true"])).toThrow (/option.*-z.*unknown/);
    expect (() => Test.Input.fromArgv (["--param-z"])).toThrow (/option.*--param-z.*unknown/);
    expect (() => Test.Input.fromArgv (["-brp=true"])).toThrow (/multiple non-boolean.*cannot be grouped/i);


    Test.Input.option ("tags...");

    expect (Test.Input.fromArgv (["--tags", "a", "b", "c"]).toPojo ()).toEqual (
    {
        boolOpt: false,
        paramA: "",
        paramB: 0,
        paramD: "",
        tags: ["a", "b", "c"]
    });


    const Move = nit.defineClass ("Move", "nit.Command")
        .defineInput (function (Input)
        {
            Input
                .option ("[from...]")
                .option ("[to]")
            ;
        })
    ;

    let argv = ["--", "a", "b"];

    expect (Move.Input.fromArgv (argv).toPojo ()).toEqual (
    {
        from: ["a"],
        to: "b"
    });

    argv = ["--", "e", "c", "a"];

    expect (Move.Input.fromArgv (argv).toPojo ()).toEqual (
    {
        from: ["e", "c"],
        to: "a"
    });

    argv = ["--"];

    expect (Move.Input.fromArgv (argv).toPojo ()).toEqual (
    {
        from: [],
        to: ""
    });

    const Copy = nit.defineClass ("Copy", "nit.Command")
        .defineInput (function (Input)
        {
            Input
                .option ("<from>")
                .option ("[to...]")
            ;
        })
    ;

    argv = ["--", "a", "b", "c"];

    expect (Copy.Input.fromArgv (argv).toPojo ()).toEqual (
    {
        from: "a",
        to: ["b", "c"]
    });

    argv = ["--", "a", "b"];

    expect (Copy.Input.fromArgv (argv).toPojo ()).toEqual (
    {
        from: "a",
        to: ["b"]
    });

    argv = ["--", "a"];

    expect (Copy.Input.fromArgv (argv).toPojo ()).toEqual (
    {
        from: "a",
        to: []
    });
});


test ("nit.Command.run ()", async () =>
{
    const Test = nit.defineClass ("Test", "nit.Command");

    expect (await Test ().run ()).toBe (undefined);

    Test
        .onRun (function (ctx)
        {
            ctx.key = "value";

            return 10;
        })
    ;

    expect (await Test ().run ()).toBe (10);

    let ctx = new Test.Context;

    await Test ().run (ctx);
    expect (ctx.key).toBe ("value");
});


test ("nit.Command.catch/finally ()", async () =>
{
    const Test = nit.defineClass ("Test", "nit.Command")
        .onRun (function ()
        {
            throw new Error ("ERR");
        })
        .onFinally (function ()
        {
            Test.finallyCalled = true;
        })
    ;

    try
    {
        await Test ().run ();
    }
    catch (e)
    {
    }

    expect (Test.finallyCalled).toBe (true);

    Test
        .onCatch (function ()
        {
            Test.catchCalled = true;
        })
    ;

    await Test ().run ();
    expect (Test.catchCalled).toBe (true);
});


test ("nit.Command.getPositionalOptions ()", async () =>
{
    const nit = await test.setupCliMode ("", "project-a", true);
    const TestCmd = nit.lookupCommand ("test-cmd");

    expect (TestCmd.Input.getPositionalOptions ()[0].name).toBe ("file");
});


test ("nit.Command.defineContext ()", async () =>
{
    const Add = nit.defineClass ("Add", "nit.Command")
        .defineInput (Input =>
        {
            Input
                .option ("<a>", "integer")
                .option ("<b>", "integer")
            ;
        })
        .defineContext (Context =>
        {
            Context
                .field ("db", "any", "The database connection.")
            ;
        })
        .onRun (function (ctx)
        {
            return ctx.input.a + ctx.input.b;
        })
    ;

    expect (Add.Context.name).toBe ("Add.Context");
    expect (Add.Context.superclass).toBe (nit.Command.Context);

    expect (await Add ().run (3, 4)).toBe (7);

    let ctx = new Add.Context;
    expect (ctx.input).toBeInstanceOf (Add.Input);

    ctx = Add.Context.forInput (7, 8);
    expect (ctx).toBeInstanceOf (Add.Context);
    expect (ctx.input).toBeInstanceOf (Add.Input);
    expect (ctx.input.a + ctx.input.b).toBe (15);

    Add.Input = null;
    ctx = new Add.Context;
    expect (ctx.input).toBeUndefined ();
});


test ("nit.Command.confirm ()", async () =>
{
    const Rmdir = nit.defineClass ("Rmdir", "nit.Command")
        .m ("info.confirmation", "Are you sure you want to delete the directory?")
        .defineInput (Input =>
        {
            Input
                .option ("<file>", "file")
            ;
        })
    ;

    const Stdio = nit.require ("nit.utils.Stdio");
    let mesg;

    Stdio.confirm = function (message)
    {
        mesg = message;
    };

    await Rmdir ().confirm ("info.confirmation");
    expect (mesg).toBe (nit.m.MESSAGES["Rmdir|info.confirmation"]);
});

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


test ("nit.Command.Type", async () =>
{
    const nit = await test.setupCliMode ("", "project-a", true);
    const TypeTester = nit.defineCommand ("TypeTester")
        .defineInput (Input =>
        {
            Input.option ("cmd", "nit.Command.Type", "The command.");
        })
    ;

    nit.require ("nit.Compgen");

    let opt = TypeTester.Input.getOptionByFlag ("cmd");
    let completer = new TypeTester.Type.Completer;
    let ctx = new nit.Compgen.Context;

    ctx.currentOption = opt;

    expect (completer.completeForType (ctx)).toEqual (
        expect.arrayContaining (
        [
            nit.Compgen.ACTIONS.VALUE,
            "hello-world",
            "invalid-cmd"
        ])
    );

    const HelloWorld = nit.lookupCommand ("hello-world");
    completer = new HelloWorld.Type.Completer;
    ctx = new nit.Compgen.Context;
    ctx.currentOption = HelloWorld.Input.getOptionByFlag ("message");

    expect (completer.completeForType (ctx)).toBeUndefined ();

    let type = new nit.Command.Type ("hello-world");
    expect (await type.lookup ()).toBe (HelloWorld);
});


test ("nit.Command.Option", () =>
{
    const Test = nit.defineClass ("Test", "nit.Command");

    let option = new Test.Option ("paramA");

    expect (option.flag).toBe ("param-a");

    option = new Test.Option ("<paramB>");

    expect (option.helpSpec).toBe ("<param-b>");
});


test ("nit.Command.InputBase", () =>
{
    const Test = nit.defineClass ("Test", "nit.Command")
        .defineInput (function (Input)
        {
            Input
                .option ("paramA")
                .option ("boolOpt", "boolean")
                .option ("paramB")
            ;
        })
    ;

    expect (() => Test.Input.option ("paramB", { shortFlag: "p" })).toThrow (/The short flag.*has been used/i);
    expect (Test.Input.option ("paramC")).toBe (Test.Input);
    expect (Test.Input.option ("paramD", { shortFlag: "d" })).toBe (Test.Input);

    expect (Test.Input.getOptionByFlag ("param-a")).toBeInstanceOf (nit.Command.Option);
    expect (Test.Input.getOptionByFlag ("param-f")).toBeUndefined ();

    expect (Test.Input.getOptionByShortFlag ("p").flag).toBe ("param-a");
    expect (Test.Input.getOptionByShortFlag ("u")).toBeUndefined ();

    expect (Test.Input.getBooleanOptionByFlag ("bool-opt")).toBeInstanceOf (nit.Command.Option);
    expect (Test.Input.getBooleanOptionByFlag ("undef-bool-opt")).toBeUndefined ();
});


test ("nit.Command.InputBase.fromArgv ()", () =>
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
    const Test = nit.defineClass ("Test", "nit.Command")
        .method ("run", function ()
        {
            return 10;
        })
    ;

    expect (await Test.run ()).toBe (10);

    const Test2 = nit.defineClass ("Test2", "nit.Command");

    expect (async () => await Test2.run ()).rejects.toThrow (/instance method.*not implemented/);
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
        .method ("run", function (ctx)
        {
            return ctx.input.a + ctx.input.b;
        })
    ;

    expect (Add.Context.name).toBe ("Add.Context");
    expect (Add.Context.superclass).toBe (nit.Command.Context);

    expect (await Add.run ([3, 4])).toBe (7);

    let ctx = new Add.Context;
    expect (ctx.input).toBeInstanceOf (Add.Input);

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


test ("nit.Command.log ()", async () =>
{
    const Test = nit.defineClass ("Test", "nit.Command")
        .m ("info.message", "Hello %{name}!")
    ;

    let mock = test.mock (nit, "log");
    new Test ().log ("info.message", { name: "John" });
    expect (mock.invocations[0].args[0]).toEqual ("Hello John!");
});

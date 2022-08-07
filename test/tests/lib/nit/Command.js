test ("nit.Command.Option", () =>
{
    const Test = nit.defineClass ("Test", "nit.Command");

    let option = new Test.Option ("paramA");

    expect (option.flag).toBe ("param-a");
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

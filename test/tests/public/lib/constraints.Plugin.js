test ("constraints.Plugin", () =>
{
    const Server = nit.defineClass ("Server")
        .plugin ("logger")
    ;


    const Task = nit.defineClass ("Task")
        .field ("<logger>", "any")
            .constraint ("plugin", "plugins.Logger")
    ;

    expect (() => new Task (new nit.Object)).toThrow (/does not.*plugin/);
    expect (new Task (Server)).toBeInstanceOf (Task);
    expect (new Task (new Server)).toBeInstanceOf (Task);
});

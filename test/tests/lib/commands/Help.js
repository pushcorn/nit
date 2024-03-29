test ("commands.Help", async () =>
{
    const nit = await test.setupCliMode ("help", "project-a", true);
    const Help = nit.lookupCommand ("help");

    nit.require ("nit.Compgen");

    expect (Help.help ().build ()).toMatch (/nit help \[command\]/);

    expect ((await Help ().run ()).output).toMatch (/nit help \[command\]/);
    expect ((await Help ().run ("console")).output).toMatch (/nit console/);
    expect ((await Help ().run ("git")).output).toMatch (/Execute a git command[\s\S]+pull/);


    const Completer = nit.lookupClass (Help.name + ".compgencompleters.Completer");

    let ctx = nit.assign (new nit.Compgen.Context,
    {
        completionType: "option",
        commandClass: Help,
        currentOption: Help.Input.fieldMap.subcommand
    });

    expect (await Completer.generate (ctx)).toBeUndefined ();

    ctx.specifiedValues.command = "git";
    expect (await Completer.generate (ctx)).toEqual (["SUBCOMMAND", "pull", "push"]);

});

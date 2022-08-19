test ("commands.Help", async () =>
{
    const nit = await test.setupCliMode ("help", "project-a", true);
    const Help = nit.lookupCommand ("help");

    expect (Help.help ()).toMatch (/nit help \[command\]/);

    expect (await Help.run ()).toMatch (/nit help \[command\]/);
    expect (await Help.run (["console"])).toMatch (/nit console/);
});

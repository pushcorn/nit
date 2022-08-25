function testCompgen ()
{
    const params = nit.typedArgsToObj (arguments,
    {
        compLine: "string",
        compPoint: "integer",
        projectPath: "string"
    });

    params.projectPath = params.projectPath || test.pathForProject ("project-a");

    return nit.Queue ()
        .push (async function (ctx)
        {
            ctx.nit = await test.setupCompletionMode (params);
            ctx.compgen = ctx.nit.new ("nit.Compgen");
        })
    ;
}


function testParseWords ()
{
    return testCompgen (...arguments)
        .push (({ compgen }) => compgen.parseWords ())
    ;
}


test ("nit.Compgen.construct ()", async () =>
{
    await testCompgen ("nit tes")
        .run (({ compgen }) =>
        {
            expect (compgen.context.quote).toBe ("");
            expect (compgen.context.compTypeChar).toBe ("!");
        })
    ;

    await testCompgen ("nit test-cmd --choice \"fir")
        .run (({ compgen }) =>
        {
            expect (compgen.context.quote).toBe ('"');
        })
    ;

    await testCompgen ("nit test-cmd --choice ")
        .run (({ compgen }) =>
        {
            expect (compgen.context.compCword).toBe (3);
        })
    ;
});


test ("nit.Compgen.dequote ()", async () =>
{
    await testParseWords ("nit test-cmd --choice \"first")
        .run (({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
        })
    ;

    await testParseWords ("nit test-cmd --choice \"first\"")
        .run (({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (compgen.context.currentValue).toBe ("first");
        })
    ;

    await testParseWords ("nit test-cmd --choice second_choice")
        .run (({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
        })
    ;
});


test ("nit.Compgen.parseWords ()", async () =>
{
    await testParseWords ("nit list-files --dir ", test.pathForProject ("project-c"))
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["DIR"]);
        })
    ;

    await testParseWords ("nit dump-file --file ", test.pathForProject ("project-c"))
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["FILE"]);
        })
    ;

    await testParseWords ("nit test-cmd --dir ", test.pathForProject ("project-c"))
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["DIR"]);
        })
    ;

    await testParseWords ("nit test-cmd", 4)
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.command);
        })
    ;

    await testParseWords ("nit test-cmd >")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.redirect);
            expect (await compgen.listCompletions ()).toEqual (["FILE"]);
        })
    ;

    await testParseWords ("nit test-cmd > nit.json ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.none);
            expect (await compgen.listCompletions ()).toEqual (["NONE"]);
        })
    ;

    await testParseWords ("nit test-cmd --choice fir --service srv1", 25)
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["VALUE", '"first choice"', '"first <! second"']);
        })
    ;

    await testParseWords ("nit test-cmd --file -- ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.none);
        })
    ;

    await testParseWords ("nit test-cmd --")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.option);
        })
    ;

    await testParseWords ("nit test-cmd -sb")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.option);
            expect (await compgen.listCompletions ()).toEqual (["OPTION", "-s"]);
        })
    ;

    await testParseWords ("nit test-cmd -gsb")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.option);
            expect (await compgen.listCompletions ()).toEqual (["OPTION", "-s"]);
        })
    ;

    await testParseWords ("nit test-cmd --choice fir")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["VALUE", '"first choice"', '"first <! second"']);
        })
    ;

    await testParseWords ("nit test-cmd --choice fir --service srv1", 21)
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.option);
            expect (await compgen.listCompletions ()).toEqual (["OPTION", "--choice"]);
        })
    ;

    await testParseWords ("nit test-cmd --choice ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["VALUE", '"first choice"', "second_choice", '"3rd choice"', '"first <! second"', '"with a \\" quote"', "size:large", "colon:sep:value"]);
        })
    ;

    await testParseWords ("nit test-cmd --ch")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.option);
            expect (await compgen.listCompletions ()).toEqual (["OPTION", "--choice"]);
        })
    ;

    await testParseWords ("nit test-cmd --choice fir --invalid", 25)
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["VALUE", '"first choice"', '"first <! second"']);
        })
    ;

    await testParseWords ("nit test-cmd --choice fir -i", 25)
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["VALUE", '"first choice"', '"first <! second"']);
        })
    ;

    await testParseWords ("nit test-cmd --choice fir -s", 25)
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["VALUE", '"first choice"', '"first <! second"']);
        })
    ;

    await testParseWords ("nit test-cmd --service srv --", 26)
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["VALUE", "srv1", "srv2"]);
        })
    ;

    await testParseWords ("nit test-cmd ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.option);
            expect (await compgen.listCompletions ()).toEqual (["FILE"]);
        })
    ;

    await testParseWords ("nit --file ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.option);
            expect (await compgen.listCompletions ()).toEqual (["OPTION"]);
        })
    ;

    await testParseWords ("nit test-cmd -xy ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.option);
            expect (await compgen.listCompletions ()).toEqual (["FILE"]);
        })
    ;

    await testParseWords ("nit test-cmd -xyd ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
        })
    ;

    await testParseWords ("nit test-cmd -b ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.option);
            expect (await compgen.listCompletions ()).toEqual (["OPTION", "--file", "--choice", "--service", "--doc-ids"]);
        })
    ;

    await testParseWords ("nit test-cmd -s srv1 ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["FILE"]);
        })
    ;

    await testParseWords ("nit test-cmd --doc-ids 1 2 -s srv1 ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["FILE"]);
        })
    ;

    await testParseWords ("nit ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.command);
            expect (await compgen.listCompletions ()).toEqual (
            [
                "COMMAND",
                "hello-world",
                "invalid-cmd",
                "no-args",
                "positional-args",
                "single-arg",
                "test-cmd",
                "console",
                "help",
                "lint",
                "run",
                "test",
                "version"
            ]);
        })
    ;
});


test ("nit.Compgen.listCompletions ()", async () =>
{
    function testListCompletions ()
    {
        return testCompgen (...arguments)
            .push (({ compgen }) => compgen.parseWords ())
            .push (async ({ compgen }) => await compgen.listCompletions ())
        ;
    }

    await testListCompletions ("nit test-cmd > /tmp/output.log")
        .run (({ result }) =>
        {
            expect (result).toEqual (["FILE"]);
        })
    ;

    await testListCompletions ("nit te")
        .run (({ result }) =>
        {
            expect (result).toEqual (["COMMAND", "test-cmd", "test"]);
        })
    ;

    await testListCompletions ("nit test-cmd ")
        .run (({ result }) =>
        {
            expect (result).toEqual (["FILE"]);
        })
    ;

    await testListCompletions ("nit no-args ")
        .run (({ result }) =>
        {
            expect (result).toEqual (["OPTION"]);
        })
    ;

    await testListCompletions ("nit single-arg ")
        .run (({ result }) =>
        {
            expect (result).toEqual (["OPTION", "--arg"]);
        })
    ;


    await testListCompletions ("nit single-arg --arg val more")
        .run (({ result }) =>
        {
            expect (result).toEqual (["NONE"]);
        })
    ;


    await testListCompletions ("nit single-arg --arg val ")
        .run (({ result }) =>
        {
            expect (result).toEqual (["OPTION"]);
        })
    ;


    await testListCompletions ("nit positional-args sfile tfile ")
        .run (({ result }) =>
        {
            expect (result).toEqual (["FILE"]);
        })
    ;


    await testListCompletions ("nit --file ")
        .run (({ result }) =>
        {
            expect (result).toEqual (["OPTION"]);
        })
    ;

    await testListCompletions ("nit hello-world ")
        .run (({ result }) =>
        {
            expect (result).toEqual (["VALUE"]);
        })
    ;

    await testListCompletions ("nit test-cmd --cho")
        .run (({ result }) =>
        {
            expect (result).toEqual (["OPTION", "--choice"]);
        })
    ;

    await testListCompletions ("nit test-cmd --choice")
        .run (({ result }) =>
        {
            expect (result).toEqual (["OPTION", "--choice"]);
        })
    ;

    await testListCompletions ("nit test-cmd -c")
        .run (({ result }) =>
        {
            expect (result).toEqual (["OPTION", "-c"]);
        })
    ;

    await testListCompletions ("nit test-cmd --file ")
        .run (({ result }) =>
        {
            expect (result).toEqual (["FILE"]);
        })
    ;

    await testListCompletions ("nit test-cmd --choice ")
        .run (({ result }) =>
        {
            expect (result).toEqual (["VALUE", '"first choice"', "second_choice", '"3rd choice"', '"first <! second"', '"with a \\" quote"', "size:large", "colon:sep:value"]);
        })
    ;

    await testListCompletions ("nit hello-world --message ")
        .run (({ result }) =>
        {
            expect (result).toEqual (["VALUE"]);
        })
    ;

    await testListCompletions ("nit test-cmd > out.txt ")
        .run (({ result }) =>
        {
            expect (result).toEqual (["NONE"]);
        })
    ;

    await testListCompletions ("nit test-cmd \">")
        .run (({ result }) =>
        {
            expect (result).toEqual (["FILE"]);
        })
    ;
});


test ("nit.Compgen.run ()", async () =>
{
    await testCompgen ("nit tes")
        .run (async ({ compgen }) =>
        {
            const log = test.mockConsoleLog (true);

            await compgen.run ();

            expect (log.restore ()).toEqual (
            [
                ["COMMAND"],
                ["test-cmd"],
                ["test"]
            ]);
        })
    ;


});

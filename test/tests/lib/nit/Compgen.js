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


test ("nit.Compgen.compgencompleters", async () =>
{
    const nit = await test.reloadNit ("project-a");

    nit.requireAll ("nit.Compgen");

    expect (nit.Compgen.completers.some (c => c.name == "nit.compgencompleters.TimezoneConstraint")).toBe (true);
    expect (nit.Compgen.completers.some (c => c.name == "nit.compgencompleters.ChoiceConstraint")).toBe (true);
    expect (nit.Compgen.completers[0].name).toBe ("nit.compgencompleters.Demo");

    const Cmd = nit.defineCommand ("Cmd")
        .defineInput (Input =>
        {
            Input
                .option ("<type>", "string")
                    .constraint ("choice", "a", "b")
                .option ("<tz>", "string")
                    .constraint ("timezone")
                .option ("output", "file")
            ;
        })
    ;

    let compgen = new nit.Compgen;
    let ctx = new nit.Compgen.Context;

    compgen.context = ctx;

    ctx.currentOption = Cmd.Input.fieldMap.type;
    expect (await compgen.invokeCompleters ("constraint")).toEqual (["VALUE", "a", "b"]);

    ctx.currentOption = Cmd.Input.fieldMap.tz;
    expect ((await compgen.invokeCompleters ("constraint")).slice (0, 3)).toEqual (["VALUE", "Africa/Abidjan", "Africa/Accra"]);

    expect (await compgen.invokeCompleters ("redirect")).toEqual (["FILE"]);

    ctx.currentOption = Cmd.Input.fieldMap.output;
    expect (await compgen.invokeCompleters ("type")).toEqual (["FILE"]);
});


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

    await testParseWords ("nit dynamic-option ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.option);
            expect (await compgen.listCompletions ()).toEqual (["VALUE", "bird", "dog"]);
        })
    ;

    await testParseWords ("nit dynamic-option dog ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["VALUE", "swim", "run"]);
        })
    ;

    await testParseWords ("nit dynamic-option bird ")
        .run (async ({ compgen, nit }) =>
        {
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["VALUE", "fly", "eat"]);
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
            expect (compgen.context.state).toBe (nit.Compgen.STATES.value);
            expect (await compgen.listCompletions ()).toEqual (["FILE"]);
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
                "dynamic-option",
                "git",
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
                "task",
                "test",
                "version"
            ]);
        })
    ;
});


test ("nit.Compgen.listCompletions ()", async () =>
{
    function testListCompletions (opts)
    {
        return testCompgen (...opts.args)
            .push (({ compgen }) => compgen.parseWords ())
            .push (async ({ compgen }) => await compgen.listCompletions ())
            .run (({ compgen, result }) =>
            {
                let expected = { args: opts.args, comps: result };

                if (opts.values)
                {
                    expected.values = compgen.context.specifiedValues;
                }

                expect (expected).toEqual (opts);
            })
        ;
    }

    let tests =
    [
        {
            "args": ["nit git push my-repo i"],
            "comps": ["VALUE", "info"],
            "values": { gitcommand: "push", repo: "my-repo", logLevel: "i" }
        },
        {
            "args": ["nit git push my-repo "],
            "comps": ["VALUE", "info", "error", "warn", "debug"]
        },
        {
            "args": ["nit git - push", 9],
            "comps": ["OPTION", "--auth", "--silent"]
        },
        {
            "args": ["nit git --auth user:pass"],
            "comps": ["VALUE"],
            "values": { auth: "user:pass" }
        },
        {
            "args": ["nit git --auth user:pass "],
            "comps": ["SUBCOMMAND", "pull", "push"]
        },
        {
            "args": ["nit git --auth user:pass pu"],
            "comps": ["SUBCOMMAND", "pull", "push"],
            "values": { auth: "user:pass", gitcommand: "pu" }
        },
        {
            "args": ["nit git --auth user:pass push "],
            "comps": ["VALUE"]
        },
        {
            "args": ["nit git --auth user:pass push -a "],
            "comps": ["VALUE"],
            "values": { auth: "user:pass", gitcommand: "push", all: "true", repo: "" }
        },
        {
            "args": ["nit git --auth "],
            "comps": ["VALUE"]
        },
        {
            "args": ["nit git --silent "],
            "comps": ["SUBCOMMAND", "pull", "push"]
        },
        {
            "args": ["nit git --silent pus"],
            "comps": ["SUBCOMMAND", "push"]
        },
        {
            "args": ["nit git --silent pull "],
            "comps": ["OPTION", "--all"]
        },
        {
            "args": ["nit git --silent pull --all "],
            "comps": ["OPTION", "--verbose", "--repository"]
        },
        {
            "args": ["nit git --silent push "],
            "comps": ["VALUE"]
        },
        {
            "args": ["nit git"],
            "comps": ["COMMAND", "git"]
        },
        {
            "args": ["nit git --"],
            "comps": ["OPTION", "--auth", "--silent"]
        },
        {
            "args": ["nit git push "],
            "comps": ["VALUE"]
        },
        {
            "args": ["nit gi"],
            "comps": ["COMMAND", "git"]
        },
        {
            "args": ["nit git "],
            "comps": ["SUBCOMMAND", "pull", "push"]
        },
        {
            "args": ["nit git pus"],
            "comps": ["SUBCOMMAND", "push"]
        },
        {
            "args": ["nit test-cmd > /tmp/output.log"],
            "comps": ["FILE"]
        },
        {
            "args": ["nit te"],
            "comps": ["COMMAND", "test-cmd", "test"]
        },
        {
            "args": ["nit test-cmd "],
            "comps": ["FILE"]
        },
        {
            "args": ["nit no-args "],
            "comps": ["OPTION"]
        },
        {
            "args": ["nit single-arg "],
            "comps": ["OPTION", "--arg"]
        },
        {
            "args": ["nit single-arg --arg val more"],
            "comps": ["NONE"]
        },
        {
            "args": ["nit single-arg --arg val "],
            "comps": ["OPTION"]
        },
        {
            "args": ["nit positional-args sfile tfile "],
            "comps": ["FILE"]
        },
        {
            "args": ["nit --file "],
            "comps": ["OPTION"]
        },
        {
            "args": ["nit hello-world "],
            "comps": ["VALUE"]
        },
        {
            "args": ["nit test-cmd --cho"],
            "comps": ["OPTION", "--choice"]
        },
        {
            "args": ["nit test-cmd --choice"],
            "comps": ["OPTION", "--choice"]
        },
        {
            "args": ["nit test-cmd -c"],
            "comps": ["OPTION", "-c"]
        },
        {
            "args": ["nit test-cmd --file "],
            "comps": ["FILE"]
        },
        {
            "args": ["nit test-cmd --choice "],
            "comps": ["VALUE", "\"first choice\"", "second_choice", "\"3rd choice\"", "\"first <! second\"", "\"with a \\\" quote\"", "size:large", "colon:sep:value"]
        },
        {
            "args": ["nit hello-world --message "],
            "comps": ["VALUE"]
        },
        {
            "args": ["nit test-cmd > out.txt "],
            "comps": ["NONE"]
        },
        {
            "args": ["nit test-cmd \">"],
            "comps": ["FILE"]
        }
    ];

    // tests = [tests[9]]; // single

    await nit.parallel (tests.map (t => function () { return testListCompletions (t); }));
});


test ("nit.Compgen.run ()", async () =>
{
    await testCompgen ("nit tes")
        .run (async ({ compgen }) =>
        {
            let mock = test.mock (console, "log", null, 3);

            await compgen.run ();

            expect (mock.invocations.map (i => i.args)).toEqual (
            [
                ["COMMAND"],
                ["test-cmd"],
                ["test"]
            ]);
        })
    ;
});

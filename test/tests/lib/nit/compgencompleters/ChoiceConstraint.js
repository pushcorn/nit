test.compgenCompleter ("nit.compgencompleters.ChoiceConstraint")
    .should ("return undefined if no matching constraint was found")
        .returns ()
        .commit ()

    .should ("return the constraint's choice values")
        .up (s => s.Cmd = nit.defineCommand ("Cmd")
            .defineInput (Input =>
            {
                Input
                    .option ("<type>", "string")
                        .constraint ("choice", "a", "b")
                ;
            })
        )
        .up (s => s.args = { completionType: "constraint", currentOption: s.Cmd.Input.fieldMap.type })
        .returns (["VALUE", "a", "b"])
        .commit ()

    .should ("be able to return the constraint's choice values of an object type")
        .up (s => s.Speed = nit.defineClass ("Speed")
            .field ("<rate>", "string")
                .constraint ("choice", "low", "medium", "high")
        )
        .up (s => s.Cmd.Input.option ("speed", "Speed"))
        .up (s => s.args = { completionType: "constraint", currentOption: s.Cmd.Input.fieldMap.speed })
        .returns (["VALUE", "low", "medium", "high"])
        .commit ()

    .should ("filter the completions")
        .up (s => s.args = { completionType: "constraint", currentValue: "l", currentOption: s.Cmd.Input.fieldMap.speed })
        .returns (["VALUE", "low"])
        .commit ()

    .should ("quote the choices with characters need to be escaped")
        .up (s => s.Cmd.Input
            .option ("opts", "string")
                .constraint ("choice", "opt 1", "opt & 2", "opt-3")
        )
        .up (s => s.args = { completionType: "constraint", currentOption: s.Cmd.Input.fieldMap.opts })
        .expectingPropertyToBe ("result", ["VALUE", '"opt 1"', '"opt & 2"', "opt-3"])
        .commit ()
;

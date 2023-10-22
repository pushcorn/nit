test.compgenCompleter ("nit.compgencompleters.TimezoneConstraint")
    .should ("return undefined if no matching constraint was found")
        .returns ()
        .commit ()

    .should ("return the constraint's choice values")
        .up (s => s.Cmd = nit.defineCommand ("Cmd")
            .defineInput (Input =>
            {
                Input
                    .option ("<tz>", "string")
                        .constraint ("timezone")
                ;
            })
        )
        .up (s => s.args = { completionType: "constraint", currentOption: s.Cmd.Input.fieldMap.tz })
        .returnsResultContaining (["VALUE", "Africa/Abidjan", "Africa/Accra"])
        .commit ()
;

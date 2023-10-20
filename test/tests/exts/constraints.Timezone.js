test.method ("constraints.Timezone.completers.Timezone", "completeForConstraint", true)
    .should ("return the completions for the constraint")
        .up (s => s.Compgen = nit.require ("nit.Compgen"))
        .up (s => s.MyCommand = nit.defineClass ("MyCommand", "nit.Command")
            .defineInput (Input =>
            {
                Input
                    .option ("<timezone>", "string")
                        .constraint ("timezone")
                    .option ("silent", "boolean")
                ;
            })
        )
        .before (s => s.args = new s.Compgen.Context (
        {
            currentOption: s.MyCommand.Input.fieldMap.timezone,
            currentValue: "Asia/T"
        }))
        .expectingPropertyToBe ("result.0", "VALUE")
        .expectingPropertyToBe ("result.1", "Asia/Taipei")
        .expectingPropertyToBe ("result.2", "Asia/Tashkent")
        .commit ()

    .should ("return no completions if no timezone constraint was defined")
        .before (s => s.args = new s.Compgen.Context (
        {
            currentOption: s.MyCommand.Input.fieldMap.silent
        }))
        .returns ()
        .commit ()
;

test.method ("constraints.Choice.completers.Choice", "getChoiceConstraint", true)
    .should ("recursively find the choice constraint")
        .up (s => s.MyClass = nit.defineClass ("MyClass")
            .field ("<timezone>", "nit.Date.Timezone")
        )
        .before (s => s.args = s.MyClass.fields[0])
        .returnsInstanceOf ("constraints.Choice")
        .expectingPropertyToContain ("result.choices", ["UTC", "America/Indianapolis"])
        .commit ()

    .should ("just return the constraint if the option is a primitive type")
        .up (s => s.MyClass = nit.defineClass ("MyClass")
            .field ("<timezone>", "string")
        )
        .before (s => s.args = s.MyClass.fields[0])
        .returns ()
        .commit ()
;


test.method ("constraints.Choice.completers.Choice", "completeForConstraint", true)
    .should ("return the completions for the constraint")
        .up (s => s.Compgen = nit.require ("nit.Compgen"))
        .up (s => s.MyCommand = nit.defineClass ("MyCommand", "nit.Command")
            .defineInput (Input =>
            {
                Input
                    .option ("<timezone>", "nit.Date.Timezone")
                    .option ("silent", "boolean")
                    .option ("opts", "string")
                        .constraint ("choice", "opt 1", "opt & 2", "opt-3")
                ;
            })
        )
        .before (s => s.args = new s.Compgen.Context (
        {
            currentOption: s.MyCommand.Input.fieldMap.timezone
        }))
        .expectingPropertyToBe ("result.0", "VALUE")
        .expectingPropertyToBe ("result.1", "Africa/Abidjan")
        .commit ()

    .should ("return undefined if no choice constraint was found")
        .before (s => s.args = new s.Compgen.Context (
        {
            currentOption: s.MyCommand.Input.fieldMap.silent
        }))
        .expectingPropertyToBe ("result", undefined)
        .commit ()

    .should ("quote the choices with characters need to be escaped")
        .before (s => s.args = new s.Compgen.Context (
        {
            currentOption: s.MyCommand.Input.fieldMap.opts
        }))
        .expectingPropertyToBe ("result", ["VALUE", '"opt 1"', '"opt & 2"', "opt-3"])
        .commit ()
;

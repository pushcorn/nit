test.method ("nit.CompgenCompleter.Completer", "generate")
    .should ("return the completions if it's applicable to the given context")
        .up (s => s.class = s.class.defineSubclass ("MyCompleter")
            .onApplicableTo (() => true)
        )
        .up (s => s.createArgs = function () { return [1, 2]; })
        .returns ([1, 2])
        .commit ()
;


test.method ("nit.CompgenCompleter.OptionCompleter", "applicableTo")
    .should ("return true if the given path matches the current command's option")
        .up (s => s.MyCmd = nit.defineClass ("test.commands.MyCmd", "nit.Command")
            .defineInput (Input =>
                Input
                    .option ("opt1", "integer")
                    .option ("opt2", "string")
            )
        )
        .up (s => s.createArgs = [function () { return [1, 2]; }, "test.commands.MyCmd.opt1"])
        .up (s => s.args =
        {
            commandClass: s.MyCmd,
            currentOption: s.MyCmd.Input.fieldMap.opt1
        })
        .returns (true)
        .commit ()

    .should ("return false if the given path DOES NOT match the current command's option")
        .up (s => s.createArgs = [function () { return [1, 2]; }, "test.commands.MyCmd.opt1"])
        .up (s => s.args =
        {
            commandClass: s.MyCmd,
            currentOption: s.MyCmd.Input.fieldMap.opt2
        })
        .returns (false)
        .commit ()

    .should ("return false if conditions are not satisfied")
        .up (s => s.createArgs = [function () { return [1, 2]; }, "test.commands.MyCmd.opt1", nit.o ({ a: 9 })])
        .up (s => s.args =
        {
            commandClass: s.MyCmd,
            currentOption: s.MyCmd.Input.fieldMap.opt1,
            specifiedValues:
            {
                a: 10
            }
        })
        .returns (false)
        .commit ()
;


test.method ("nit.CompgenCompleter.RedirectCompleter", "applicableTo")
    .should ("will always return true")
        .up (s => s.MyCmd = nit.defineClass ("test.commands.MyCmd", "nit.Command")
            .defineInput (Input =>
                Input
                    .option ("opt1", "integer")
                    .option ("opt2", "string")
            )
        )
        .up (s => s.createArgs = [function () { return ["FD"]; }])
        .up (s => s.args =
        {
            currentOption: s.MyCmd.Input.fieldMap.opt1
        })
        .returns (true)
        .commit ()

    .reset ()
        .up (s => s.createArgs = [function () { return ["FD"]; }])
        .up (s => s.args =
        {
            currentOption: s.MyCmd.Input.fieldMap.opt2
        })
        .returns (true)
        .commit ()
;


test.method ("nit.CompgenCompleter.TypeCompleter", "applicableTo")
    .should ("return true if the current option's type matches one of the specified types")
        .up (s => s.MyCmd = nit.defineClass ("test.commands.MyCmd", "nit.Command")
            .defineInput (Input =>
                Input
                    .option ("opt1", "integer")
                    .option ("opt2", "string")
            )
        )
        .up (s => s.createArgs = [function () { return ["FD"]; }, "integer"])
        .up (s => s.args =
        {
            currentOption: s.MyCmd.Input.fieldMap.opt1
        })
        .returns (true)
        .commit ()

    .should ("return false if the current option's type DOES NOT match any of the specified types")
        .up (s => s.createArgs = [function () { return ["FD"]; }, "integer"])
        .up (s => s.args =
        {
            currentOption: s.MyCmd.Input.fieldMap.opt2
        })
        .returns (false)
        .commit ()
;


test.method ("nit.CompgenCompleter.ConstraintCompleter", "applicableTo")
    .should ("return true if the current option's constraint matches the specified type")
        .up (s => s.MyCmd = nit.defineClass ("test.commands.MyCmd", "nit.Command")
            .defineInput (Input =>
                Input
                    .option ("opt1", "integer")
                        .constraint ("min", 1)
            )
        )
        .up (s => s.createArgs = [function () { return [1]; }, "constraints.Min"])
        .up (s => s.args = nit.new ("nit.Compgen.Context",
        {
            currentOption: s.MyCmd.Input.fieldMap.opt1
        }))
        .returns (true)
        .commit ()

    .should ("return false if no matching constraint from the current option")
        .up (s => s.createArgs = [function () { return [1]; }, "constraints.Max"])
        .up (s => s.args = nit.new ("nit.Compgen.Context",
        {
            currentOption: s.MyCmd.Input.fieldMap.opt1
        }))
        .returns (false)
        .commit ()
;


test.method ("nit.CompgenCompleter", "prioritize", true)
    .should ("set the priority of the completer")
        .given (100)
        .expectingPropertyToBe ("class.priority", 100)
        .commit ()
;


test.method ("nit.CompgenCompleter", "completeForRedirect", true)
    .should ("add a redirect completer")
        .given (() => ["/a/b", "c/d"])
        .expectingPropertyToBe ("class.completers.length", 1)
        .expectingPropertyToBeOfType ("class.completers.0", "nit.CompgenCompleter.RedirectCompleter")
        .commit ()
;


test.method ("nit.CompgenCompleter", "completeForOption", true)
    .should ("add an option completer")
        .given ("test.commands.MyCmd.opt1", () => [3, 4])
        .expectingPropertyToBe ("class.completers.length", 2)
        .expectingPropertyToBeOfType ("class.completers.1", "nit.CompgenCompleter.OptionCompleter")
        .commit ()
;


test.method ("nit.CompgenCompleter", "completeForType", true)
    .should ("add a type completer")
        .given ("nit.File", () => ["/a/b", "e/f"])
        .expectingPropertyToBe ("class.completers.length", 3)
        .expectingPropertyToBeOfType ("class.completers.2", "nit.CompgenCompleter.TypeCompleter")
        .commit ()
;


test.method ("nit.CompgenCompleter", "completeForConstraint", true)
    .should ("add a constraint completer")
        .given ("constraints.Choice", ctx => ctx.currentConstraint.choiceValues)
        .expectingPropertyToBe ("class.completers.length", 4)
        .expectingPropertyToBeOfType ("class.completers.3", "nit.CompgenCompleter.ConstraintCompleter")
        .commit ()
;


test.method ("nit.CompgenCompleter", "generate", true)
    .should ("generate the completions")
        .up (s => s.MyCmd = nit.defineClass ("test.commands.MyCmd", "nit.Command")
            .defineInput (Input =>
                Input
                    .option ("opt1", "integer")
                    .option ("opt2", "string")
                        .constraint ("choice", "c1", "c2")
                    .option ("opt3", "dir")
                    .option ("opt4", "nit.File")
                    .option ("opt5", "nit.Dir")
            )
        )
        .up (s => s.args = nit.assign (new nit.Compgen.Context,
        {
            commandClass: s.MyCmd,
            currentOption: s.MyCmd.Input.fieldMap.opt1,
            completionType: "option"
        }))
        .returns ([3, 4])
        .commit ()

    .reset ()
        .up (s => s.args = nit.new ("nit.Compgen.Context",
        {
            currentOption: s.MyCmd.Input.fieldMap.opt2,
            completionType: "option"
        }))
        .returns ()
        .commit ()

    .reset ()
        .up (s => s.args = nit.new ("nit.Compgen.Context",
        {
            currentOption: s.MyCmd.Input.fieldMap.opt2,
            completionType: "constraint"
        }))
        .returns (["c1", "c2"])
        .commit ()

    .reset ()
        .up (s => s.args = nit.new ("nit.Compgen.Context",
        {
            currentOption: s.MyCmd.Input.fieldMap.opt3,
            completionType: "redirect"
        }))
        .returns (["/a/b", "c/d"])
        .commit ()

    .reset ()
        .up (s => s.args = nit.new ("nit.Compgen.Context",
        {
            currentOption: s.MyCmd.Input.fieldMap.opt4,
            completionType: "type"
        }))
        .returns (["/a/b", "e/f"])
        .commit ()

    .should ("return undefined if not suitable completer was found")
        .up (s => s.args = nit.new ("nit.Compgen.Context",
        {
            currentOption: s.MyCmd.Input.fieldMap.opt5
        }))
        .returns ()
        .commit ()
;

test.method ("nit.CommandAdapter", "registerCommands", true)
    .should ("register the commands to be generated")
        .project ("project-d", true)
        .before (s => s.object = nit.require ("commandadapters.Api")
            .defineSubclass ("commandadapters.Test")
            .meta (
            {
                category: "apis"
            })
        )
        .mock (nit.registerClass, "lazy")
        .after (s => s.object.registerCommands ())
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "commands.TestApi")
        .commit ()

    .should ("prepend the specified prefix if specified")
        .project ("project-d", true)
        .before (s => s.object = nit.require ("commandadapters.Api")
            .defineSubclass ("commandadapters.Test")
            .meta (
            {
                category: "apis",
                prefix: "my"
            })
        )
        .mock (nit.registerClass, "lazy")
        .returns ()
        .expectingPropertyToBe ("mocks.0.invocations.length", 1)
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", "commands.MyTestApi")
        .commit ()

    .should ("invoke the buildCommand hook when the class is looked up")
        .project ("project-d", true)
        .before (s => s.object = nit.require ("commandadapters.Api")
            .defineSubclass ("commandadapters.Test")
            .meta (
            {
                category: "apis"
            })
        )
        .after (s => s.cmdClass = nit.lookupClass ("commands.TestApi"))
        .returns ()
        .expectingPropertyToBe ("cmdClass.name", "commands.TestApi")
        .expectingPropertyToBe ("cmdClass.built", true)
        .commit ()
;

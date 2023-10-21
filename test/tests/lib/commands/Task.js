nit.require ("nit.Subcommand").autoRegister = false;


test.command ("commands.Task")
    .should ("run the specified task")
        .project ("project-a")
        .up (s => s.class.Input.subcommandOption.class.registerSubcommands ())
        .given ("nit:say-hello", "there")
        .returns ("Hello there!")
        .commit ()
;

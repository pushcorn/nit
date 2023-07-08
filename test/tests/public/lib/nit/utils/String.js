test.method ("nit.utils.String", "intHash", true)
    .should ("return an integer hash for the given string")
        .given ("test")
        .returns (3556498)
        .commit ()

    .given ("")
        .returns (0)
        .commit ()
;

test.method ("nit.utils.String", "intHash", true)
    .should ("return an integer hash for the given string")
        .given ("test")
        .returns (3556498)
        .commit ()

    .given ("")
        .returns (0)
        .commit ()
;


test.method ("nit.utils.String", "slugify", true)
    .should ("generate a slug %{result} for the given string %{args.0}")
        .given ("te st")
        .given ("te_st")
        .given ("te---st")
        .given ("te   st")
        .given ("te   st---")
        .returns ("te-st")
        .commit ()

    .reset ()
        .given ("àβçƌ")
        .returns ("ac")
        .commit ()

    .reset ()
        .given ("crème de la CRÈME")
        .returns ("creme-de-la-creme")
        .commit ()
;

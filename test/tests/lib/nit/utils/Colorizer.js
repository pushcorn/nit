test.method ("nit.utils.Colorizer", "colorize", true)
    .should ("return the colorized string")
        .given ("bold", "bold", "underline")
        .returns ("\x1b[4m\x1b[1mbold\x1b[22m\x1b[24m")
        .commit ()
;


test.method ("nit.utils.Colorizer", "red", true)
    .should ("return the string in red")
        .given ("red")
        .returns ("\x1b[31mred\x1b[39m")
        .commit ()
;

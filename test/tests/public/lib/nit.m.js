test ("nit.m () defines a message for translation.", () =>
{
    nit.Obj = nit.createFunction ("nit.Obj");

    nit.m.MESSAGES = {};

    nit.m ("error.empty_name", " The name cannot be empty.");
    nit.m (nit.Obj, "error.empty_name", " The name for Obj cannot be empty.");
    nit.m ("nit.AnotherObj", "error.empty_name", " The name for Obj cannot be empty.");

    expect (nit.m.MESSAGES).toEqual (
    {
        "error.empty_name": " The name cannot be empty.",
        "nit|Obj|error.empty_name": " The name for Obj cannot be empty.",
        "nit|AnotherObj|error.empty_name": " The name for Obj cannot be empty."
    });

});

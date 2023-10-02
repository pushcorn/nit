test.object ("classconfigurators.SetMeta")
    .should ("throw if the neither key nor entries was specified")
        .given ("User")
        .throws ("error.exclusive_fields")
        .commit ()
;


test.method ("classconfigurators.SetMeta", "configure")
    .should ("update the metadata of the specified class")
        .up (s => s.User = nit.defineClass ("User")
            .defineMeta ("flag", "string")
        )
        .up (s => s.createArgs = ["User", { entries: { key: "flag", value: "abc" } }])
        .up (s => s.args = s.User)
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("User.flag", "abc")
        .commit ()

    .reset ()
        .up (s => s.createArgs = ["User", { key: "flag", value: "cde" }])
        .up (s => s.args = s.User)
        .returnsInstanceOf (Function)
        .expectingPropertyToBe ("User.flag", "cde")
        .commit ()
;

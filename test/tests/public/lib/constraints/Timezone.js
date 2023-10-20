test.method ("constraints.Timezone", "validate")
    .should ("return true if the timezone is valid")
        .given ({ value: "Asia/Taipei" })
        .returns (true)
        .commit ()

    .should ("throw if the timezone is NOT valid")
        .given ({ value: "AGCD" })
        .throws ("error.invalid_timezone")
        .commit ()
;

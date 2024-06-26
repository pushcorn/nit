test.method ("nit.AssetResolver", "resolve")
    .should ("return the absolute path for a resolvable asset")
        .up (s => s.createArgs = nit.ASSET_PATHS)
        .given ("resources/test-config.json")
        .returns (nit.path.join (nit.HOME, "test/resources/test-config.json"))
        .commit ()

    .should ("return undefined if path is not resolvable")
        .up (s => s.createArgs = nit.ASSET_PATHS)
        .given ("test.html")
        .returns ()
        .commit ()

    .should ("be able to resolve assets under aliased paths")
        .up (s => s.createArgs = ["@@pushcorn/nit"])
        .given ("package.json")
        .returns (nit.path.join (nit.HOME, "package.json"))
        .commit ()

    .should ("skip invalid path alias")
        .up (s => s.createArgs = ["@@pushcorn/nit/lib", "@@pushcorn/invalid"])
        .given ("package.json")
        .returns ()
        .expectingPropertyToBe ("object.roots", [nit.path.join (nit.HOME, "lib")])
        .commit ()

    .should ("return undefined if the path is empty")
        .up (s => s.createArgs = ["@@pushcorn/nit"])
        .given ("")
        .returns ()
        .commit ()

    .should ("try to resolve the asset under the specified subdirectories")
        .up (s => s.createArgs = "resources")
        .given ("eslint/eslint.config.mjs")
        .returns (nit.path.join (nit.HOME, "resources/eslint/eslint.config.mjs"))
        .expectingPropertyToBe ("object.roots.0", /^\/.*\/resources$/)
        .commit ()
;


test.object ("nit.AssetResolver")
    .should ("resolve the . directory")
        .given (".")
        .expectingPropertyToBe ("result.roots.0", nit.HOME)
        .commit ()

    .should ("try to resolve the .. directory")
        .given ("..")
        .expectingPropertyToBe ("result.roots.0", nit.path.join (nit.HOME, ".."))
        .commit ()
;

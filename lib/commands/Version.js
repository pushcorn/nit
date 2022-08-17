module.exports = function (nit)
{
    return nit.defineCommand ("commands.Version")
        .describe ("Print the version number.")
        .defineInput (Input =>
        {
            Input.option ("verbose", "boolean", "Show the verbose output.");
        })
        .method ("run", function (ctx)
        {
            let { verbose } = ctx.input;
            let help = nit.new ("nit.utils.HelpBuilder");

            if (verbose)
            {
                for (let p of nit.ASSET_PATHS)
                {
                    let pkgFile = nit.path.join (p, "package.json");

                    if (nit.fs.existsSync (pkgFile))
                    {
                        let pkg = nit.require (pkgFile);

                        help.paragraph (
                        [
                            pkg.name,
                            "  Version: " + pkg.version,
                            "  Path: " + p
                        ].join ("\n"));
                    }
                }
            }
            else
            {
                let pkg = nit.require (nit.path.join (nit.resolvePackageRoot (), "package.json"));

                help.paragraph (`${pkg.name} ${pkg.version}`);
            }

            return help.build ();
        })
    ;
};

module.exports = function (nit)
{
    return nit.defineClass ("nit.Dir")
        .defineInnerClass ("Completer", "nit.compgen.Completer", function (Completer)
        {
            Completer
                .method ("completeForType", function (ctx)
                {
                    if (ctx.currentOption?.type == "nit.Dir")
                    {
                        return [nit.Compgen.ACTIONS.DIR];
                    }
                })
            ;
        })
        .field ("<path>", "string", "The dir path.")

        .getter ("absPath", function ()
        {
            return nit.absPath (this.path);
        })
        .method ("exists", function ()
        {
            return nit.fs.existsSync (this.absPath);
        })
        .method ("join", function (path, relative)
        {
            return nit.path.join (relative ? this.path : this.absPath, path || "");
        })
        .method ("subdir", function (path)
        {
            return nit.Dir (this.join (path, true));
        })
        .method ("create", function (subdir)
        {
            let dir = this.join (subdir);

            nit.fs.mkdirSync (dir, { recursive: true });

            return this;
        })
        .method ("createAsync", async function (subdir)
        {
            let dir = this.join (subdir);

            await nit.fs.promises.mkdir (dir, { recursive: true });

            return this;
        })
        .method ("read", function (withFileTypes, encoding)
        {
            ({ withFileTypes = false, encoding = "utf8" } = nit.typedArgsToObj (arguments,
            {
                withFileTypes: "boolean",
                encoding: "string"
            }));

            return nit.fs.readdirSync (this.absPath, { withFileTypes, encoding });
        })
        .method ("readAsync", async function (withFileTypes, encoding)
        {
            ({ withFileTypes = false, encoding = "utf8" } = nit.typedArgsToObj (arguments,
            {
                withFileTypes: "boolean",
                encoding: "string"
            }));

            return await nit.fs.promises.readdir (this.absPath, { withFileTypes, encoding });
        })
        .method ("readFile", function (path, optional, encoding)
        {
            ({ path, optional = false, encoding = "utf8" } = nit.typedArgsToObj (arguments,
            {
                path: "string",
                optional: "boolean",
                encoding: "string"
            }));

            return nit.readFile (this.join (path), optional, encoding);
        })
        .method ("readFileAsync", async function (path, optional, encoding)
        {
            ({ path, optional = false, encoding = "utf8" } = nit.typedArgsToObj (arguments,
            {
                path: "string",
                optional: "boolean",
                encoding: "string"
            }));

            return await nit.readFileAsync (this.join (path), optional, encoding);
        })
        .method ("writeFile", function (path, content, encoding)
        {
            this.create (nit.path.parse (path).dir);

            nit.fs.writeFileSync (this.join (path), content, nit.fileEncodingForContent (content, encoding));
        })
        .method ("writeFileAsync", async function (path, content, encoding)
        {
            this.create (nit.path.parse (path).dir);

            await nit.fs.promises.writeFile (this.join (path), content, nit.fileEncodingForContent (content, encoding));
        })
        .method ("rm", function (recursive, force)
        {
            ({ recursive = true, force = true } = nit.typedArgsToObj (arguments,
            {
                recursive: "boolean",
                force: "boolean"
            }));

            nit.fs.rmSync (this.absPath, { recursive, force });
        })
        .method ("rmAsync", async function (recursive, force)
        {
            ({ recursive = true, force = true } = nit.typedArgsToObj (arguments,
            {
                recursive: "boolean",
                force: "boolean"
            }));

            await nit.fs.promises.rm (this.absPath, { recursive, force });
        })
    ;
};

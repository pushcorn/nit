module.exports = function (nit)
{
    return nit.defineClass ("nit.Dir")
        .registerStringTypeParser ("dir")
        .plugin ("compgen-completer")
        .defineCompgenCompleter (Completer =>
        {
            Completer
                .completeForType (["dir", "nit.Dir"], () => [nit.Compgen.ACTIONS.DIR])
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
        .typedMethod ("read",
            {
                withFileTypes: "boolean", encoding: "string"
            },
            function (withFileTypes = false, encoding = "utf8")
            {
                return nit.fs.readdirSync (this.absPath, { withFileTypes, encoding });
            }
        )
        .typedMethod ("readAsync",
            {
                withFileTypes: "boolean", encoding: "string"
            },
            async function (withFileTypes = false, encoding = "utf8")
            {
                return await nit.fs.promises.readdir (this.absPath, { withFileTypes, encoding });
            }
        )
        .typedMethod ("readFile",
            {
                path: "string", optional: "boolean", encoding: "string"
            },
            function (path, optional = false, encoding = "utf8")
            {
                return nit.readFile (this.join (path), optional, encoding);
            }
        )
        .typedMethod ("readFileAsync",
            {
                path: "string", optional: "boolean", encoding: "string"
            },
            async function (path, optional = false, encoding = "utf8")
            {
                return await nit.readFileAsync (this.join (path), optional, encoding);
            }
        )
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
        .typedMethod ("rm",
            {
                recursive: "boolean", force: "boolean"
            },
            function (recursive = true, force = true)
            {
                nit.fs.rmSync (this.absPath, { recursive, force });
            }
        )
        .typedMethod ("rmAsync",
            {
                recursive: "boolean", force: "boolean"
            },
            async function (recursive = true, force = true)
            {
                await nit.fs.promises.rm (this.absPath, { recursive, force });
            }
        )
        .method ("toString", function ()
        {
            return this.path;
        })
    ;
};

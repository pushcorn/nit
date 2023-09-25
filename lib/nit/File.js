module.exports = function (nit)
{
    return nit.defineClass ("nit.File")
        .registerTypeParser (new nit.Object.PrimitiveTypeParser ("file", "", function (v) { return nit.Object.PrimitiveTypeParser.valueToString (v); }))
        .defineInnerClass ("completers.File", "nit.compgen.Completer", function (Completer)
        {
            Completer
                .onCompleteForRedirect (function (ctx) // eslint-disable-line no-unused-vars
                {
                    return [nit.Compgen.ACTIONS.FILE];
                })
                .onCompleteForType (function (ctx)
                {
                    let type = ctx.currentOption?.type;

                    if (type == "nit.File" || type == "file")
                    {
                        return [nit.Compgen.ACTIONS.FILE];
                    }
                })
            ;
        })

        .field ("<path>", "string", "The file path.")

        .getter ("dirname", function ()
        {
            return nit.path.dirname (this.path);
        })
        .getter ("basename", function ()
        {
            return nit.path.basename (this.path);
        })
        .getter ("absPath", function ()
        {
            return nit.absPath (this.path);
        })

        .method ("read", function (optional, encoding)
        {
            ({ optional = false, encoding = "utf8" } = nit.typedArgsToObj (arguments,
            {
                optional: "boolean",
                encoding: "string"
            }));

            return nit.readFile (this.absPath, optional, encoding);
        })
        .method ("readAsync", async function (optional, encoding)
        {
            ({ optional = false, encoding = "utf8" } = nit.typedArgsToObj (arguments,
            {
                optional: "boolean",
                encoding: "string"
            }));

            return await nit.readFileAsync (this.absPath, optional, encoding);
        })
        .method ("exists", function ()
        {
            return nit.fs.existsSync (this.absPath);
        })
        .method ("stat", function ()
        {
            return nit.fs.statSync (this.absPath);
        })
        .method ("copy", function (dest, mode)
        {
             nit.fs.copyFileSync (this.absPath, dest, mode);
        })
        .method ("rm", function ()
        {
            nit.fs.rmSync (this.absPath, { force: true });
        })
        .method ("write", function (content, encoding)
        {
            nit.fs.writeFileSync (this.absPath, content, nit.fileEncodingForContent (content, encoding));
        })
        .method ("writeAsync", async function (content, encoding)
        {
            await nit.fs.promises.writeFile (this.absPath, content, nit.fileEncodingForContent (content, encoding));
        })
    ;
};

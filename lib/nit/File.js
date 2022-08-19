module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.File"))
        .defineInnerClass ("Completer", "nit.compgen.Completer", function (Completer)
        {
            Completer
                .method ("completeForType", function (ctx)
                {
                    if (ctx.currentOption?.type == "nit.File")
                    {
                        return [nit.Compgen.ACTIONS.FILE];
                    }
                })
            ;
        })
        .staticMethod ("encodingForContent", function (content, encoding)
        {
            return encoding === undefined && nit.is.str (content) ? "utf8" : encoding;
        })

        .field ("<path>", "string", "The file path.",
        {
            setter: function (v)
            {
                v = nit.path.normalize (v);

                if (v.startsWith ("~" + nit.path.sep))
                {
                    v = nit.USER_HOME + v.slice (1);
                }

                return v;
            }
        })

        .getter ("dirname", function ()
        {
            return nit.path.dirname (this.path);
        })
        .getter ("basename", function ()
        {
            return nit.path.basename (this.path);
        })

        .method ("read", function (optional, encoding)
        {
            ({ optional = false, encoding = "utf8" } = nit.typedArgsToObj (arguments,
            {
                optional: "boolean",
                encoding: "string"
            }));

            return nit.readFile (this.path, optional, encoding);
        })
        .method ("readAsync", async function (optional, encoding)
        {
            ({ optional = false, encoding = "utf8" } = nit.typedArgsToObj (arguments,
            {
                optional: "boolean",
                encoding: "string"
            }));

            return await nit.readFileAsync (this.path, optional, encoding);
        })
        .method ("exists", function ()
        {
            return nit.fs.existsSync (this.path);
        })
        .method ("stat", function ()
        {
            return nit.fs.statSync (this.path);
        })
        .method ("copy", function (dest, mode)
        {
             nit.fs.copyFileSync (this.path, dest, mode);
        })
        .method ("rm", function ()
        {
            nit.fs.rmSync (this.path, { force: true });
        })
        .method ("write", function (content, encoding)
        {
            nit.fs.writeFileSync (this.path, content, Self.encodingForContent (content, encoding));
        })
        .method ("writeAsync", async function (content, encoding)
        {
            await nit.fs.promises.writeFile (this.path, content, Self.encodingForContent (content, encoding));
        })
    ;
};

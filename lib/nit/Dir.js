module.exports = function (nit)
{
    return nit.defineClass ("nit.Dir")
        .m ("error.entity_not_directory", "The path '%{path}' points to a non-directory entity.")

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

        .method ("join", function (path)
        {
            return nit.path.join (this.path, path || "");
        })
        .method ("create", function (subdir)
        {
            let newDirs = [];
            let dir = this.join (subdir);
            let parent;

            while (parent != dir)
            {
                parent = dir;

                try
                {
                    let stat = nit.fs.statSync (dir);

                    if (stat.isDirectory ())
                    {
                        break;
                    }
                    else
                    {
                        this.throw ("error.entity_not_directory", { path: dir });
                    }
                }
                catch (e)
                {
                    if (e.code == "ENOENT")
                    {
                        newDirs.unshift (dir);

                        dir = nit.path.dirname (dir);
                    }
                    else
                    if (e.code == "ENOTDIR")
                    {
                        this.throw ("error.entity_not_directory", { path: dir });
                    }
                    else
                    {
                        throw e;
                    }
                }
            }

            for (let d of newDirs)
            {
                nit.fs.mkdirSync (d);
            }
        })
        .method ("read", function (withFileTypes, encoding)
        {
            ({ withFileTypes = false, encoding = "utf8" } = nit.typedArgsToObj (arguments,
            {
                withFileTypes: "boolean",
                encoding: "string"
            }));

            return nit.fs.readdirSync (this.path, { withFileTypes, encoding });
        })
        .method ("rm", function (recursive, force)
        {
            ({ recursive = true, force = true } = nit.typedArgsToObj (arguments,
            {
                recursive: "boolean",
                force: "boolean"
            }));

            nit.fs.rmSync (this.path, { recursive, force });
        })
    ;
};

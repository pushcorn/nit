module.exports = function (nit)
{
    return nit.defineClass ("nit.AssetResolver")
        .field ("[roots...]", "dir", "The root directories of file to be resolve.",
        {
            setter: function (v)
            {
                return nit.array (nit.array (v)
                    .map (r =>
                    {
                        if (r[0] == "@")
                        {
                            for (let k in nit.PATH_ALIASES)
                            {
                                let v = nit.PATH_ALIASES[k];

                                if ((r.substr (1) + "/").startsWith (k + "/"))
                                {
                                    return v + r.substr (1 + k.length);
                                }
                            }

                            return "";
                        }

                        if ((r + "/").match (/^\.\.?\//))
                        {
                            return nit.path.resolve (r);
                        }
                        else
                        if (nit.path.isAbsolute (r))
                        {
                            return r;
                        }
                        else
                        {
                            return nit.ASSET_PATHS.map (p => nit.path.join (p, r));
                        }
                    }), true)
                    .filter (nit.is.not.empty)
                    .filter (nit.isDir)
                ;
            }
        })
        .method ("resolve", async function (path)
        {
            if (nit.is.empty (path))
            {
                return;
            }

            for (let root of this.roots)
            {
                let absPath = nit.path.join (root, path);

                try
                {
                    return (await nit.fs.promises.stat (absPath)) && absPath;
                }
                catch (e)
                {
                }
            }
        })
    ;
};

module.exports = function (nit)
{
    return nit.defineClass ("nit.cache.entries.File", "nit.cache.Entry")
        .do (Self =>
        {
            let field = Self.getField ("key").constraint ("asset-path", { message: "The file '%{value}' was not found." });

            field.setter = function (v)
            {
                return nit.resolveAsset (v);
            };
        })
        .method ("buildTags", async function (ctx) // eslint-disable-line no-unused-vars
        {
            let path = this.key;
            let stats = await nit.fs.promises.stat (path);
            let tags =
            {
                path,
                mtime: stats.mtime.toISOString (),
                size: stats.size
            };

            return tags;
        })
        .method ("buildValue", async function (ctx) // eslint-disable-line no-unused-vars
        {
            return await nit.readFileAsync (this.tags.path);
        })
    ;
};

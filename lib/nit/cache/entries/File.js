module.exports = function (nit)
{
    return nit.defineClass ("nit.cache.entries.File", "nit.cache.Entry")
        .method ("buildTags", async function (ctx) // eslint-disable-line no-unused-vars
        {
            let path = nit.resolveAsset (this.key);

            if (!path)
            {
                nit.throw ("error.file_not_found", { path: this.key });
            }

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

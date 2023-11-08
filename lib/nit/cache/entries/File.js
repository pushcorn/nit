module.exports = function (nit)
{
    return nit.defineClass ("nit.cache.entries.File", "nit.cache.Entry")
        .field ("<key>", "string", "The cache key.", { order: 1 })
            .constraint ("asset-path", { message: "The file '%{value}' was not found." })
        .field ("[value]", "any", "The cache value.")

        .onBuildTags (async function (ctx) // eslint-disable-line no-unused-vars
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
        .onBuildValue (async function (ctx) // eslint-disable-line no-unused-vars
        {
            return await nit.readFileAsync (this.tags.path);
        })
    ;
};

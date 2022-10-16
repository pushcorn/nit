module.exports = function (nit)
{
    return nit.defineClass ("nit.Cache")
        .field ("<entryType>", "string", "The entry type.")
            .constraint ("subclass", "nit.cache.Entry")
        .property ("entries", "object")

        .method ("put", function (entry)
        {
            this.entries[entry.key] = entry;
        })
        .method ("get", function (key, ...constructorArgs)
        {
            return this.entries[key] = this.entries[key] || nit.new (this.entryType, [key].concat (constructorArgs));
        })
        .method ("fetch", async function (key, ctx, ...constructorArgs)
        {
            return await this.get (key, ...constructorArgs).fetch (ctx);
        })
    ;
};

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
            let entry = this.entries[key];

            if (!entry)
            {
                entry = nit.new (this.entryType, [key].concat (constructorArgs));

                this.entries[entry.key] = entry;
            }

            return entry;
        })
        .method ("fetch", async function (key, ctx, ...constructorArgs)
        {
            return await this.get (key, ...constructorArgs).fetch (ctx);
        })
    ;
};

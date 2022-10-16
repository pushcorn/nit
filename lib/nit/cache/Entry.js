module.exports = function (nit)
{
    const writer = new nit.Object.Property.Writer;


    return nit.defineClass ("nit.cache.Entry")
        .field ("<key>", "string", "The cache key.")
        .field ("[value]", "any", "The cache value.")
        .property ("tags", "object")
        .property ("dependencies...", "nit.cache.Entry")
        .property ("resolution", "Promise", { writer })
        .property ("version", "string", { writer })

        .method ("addDependency", function (dep)
        {
            if (!nit.find (this.dependencies, "key", dep.key))
            {
                this.dependencies.push (dep);
            }

            return this;
        })
        .method ("fetch", async function (ctx)
        {
            if (this.resolution)
            {
                return this.resolution;
            }

            let resolve, reject;
            let resolution = new Promise ((res, rej) =>
            {
                resolve = res;
                reject = rej;
            });

            this.resolution = writer.value (resolution);

            let depChanged = false;

            try
            {
                for (let dep of this.dependencies)
                {
                    let oldDepVersion = dep.version;

                    await dep.fetch (ctx);

                    if (oldDepVersion != dep.version)
                    {
                        depChanged = true;
                    }
                }

                let newTags = await this.buildTags (ctx);

                if (depChanged || !nit.is.equal (this.tags, newTags))
                {
                    this.tags = newTags;
                    this.value = await this.buildValue (ctx);
                    this.version = writer.value (nit.uuid ());
                }

                resolve (this.value);
            }
            catch (e)
            {
                reject (e);
            }

            this.resolution = writer.value ();

            return resolution;
        })
        .method ("buildTags", async function (ctx) // eslint-disable-line no-unused-vars
        {
            return {};
        })
        .method ("buildValue", async function (ctx) // eslint-disable-line no-unused-vars
        {
            return this.value;
        })
    ;
};

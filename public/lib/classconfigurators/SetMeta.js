module.exports = function (nit, Self)
{
    return (Self = nit.defineClassConfigurator ("SetMeta"))
        .defineInnerClass ("Entry", function (Entry)
        {
            Entry
                .field ("<key>", "string")
                .field ("[value]", "any")
                .method ("set", function (cls)
                {
                    var self = this;
                    var ks = nit.kvSplit (self.key, ".", true);

                    nit.get (cls, ks[0]).meta (ks[1], self.value);
                })
            ;
        })
        .field ("key", "string", "The metadata key.")
        .field ("value", "any", "The metadata value.")
        .field ("entries...", Self.Entry.name, "The metadata entries.")
        .check ("exclusive", "key", "entries")
        .onConstruct (function ()
        {
            var self = this;

            if (self.key)
            {
                self.entries.push ({ key: self.key, value: self.value });
                self.key = "";
            }
        })
        .onConfigure (function (cls)
        {
            var self = this;

            self.entries.forEach (function (e)
            {
                e.set (cls);
            });

            return self;
        })
    ;
};

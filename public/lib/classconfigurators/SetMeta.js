module.exports = function (nit, Self)
{
    return (Self = nit.defineClassConfigurator ("SetMeta"))
        .defineInnerClass ("Entry", function (Entry)
        {
            Entry
                .field ("<key>", "string")
                .field ("[value]", "any")
            ;
        })
        .field ("key", "string", "The metadata key.")
        .field ("value", "any", "The metadata value.")
        .field ("entries...", Self.Entry.name, "The metadata entries.")
        .check ("exclusive", "key", "entries")
        .onConfigure (function (cls)
        {
            var self = this;

            if (self.key)
            {
                cls.meta (self.key, self.value);
            }
            else
            {
                self.entries.forEach (function (e)
                {
                    cls.meta (e.key, e.value);
                });
            }

            return self;
        })
    ;
};

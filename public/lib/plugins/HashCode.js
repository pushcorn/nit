module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("HashCode"))
        .use ("nit.utils.String")
        .field ("[fields...]", "string", "The fields to be hashed.")
        .onUsedBy (function (hostClass)
        {
            var plugin = this;

            hostClass
                .getter ("hashCode", function ()
                {
                    var pojo = this.toPojo ();

                    if (plugin.fields.length)
                    {
                        pojo = nit.pick (pojo, plugin.fields);
                    }

                    return Self.String.intHash (nit.toJson ([this.constructor.name, pojo]));
                })
            ;
        })
    ;
};

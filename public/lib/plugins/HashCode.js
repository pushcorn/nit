module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("HashCode"))
        .use ("nit.utils.String")
        .staticMethod ("onUsePlugin", function (hostClass, plugin)
        {
            hostClass
                .getter ("hashCode", function ()
                {
                    return Self.String.intHash (nit.toJson ([this.constructor.name, this.toPojo ()]));
                })
            ;
        })
    ;
};

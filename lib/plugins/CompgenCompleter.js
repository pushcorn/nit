module.exports = function (nit)
{
    return nit.definePlugin ("CompgenCompleter")
        .staticMethod ("onUsePlugin", function (hostClass)
        {
            hostClass
                .staticMethod ("defineCompgenCompleter", function (builder)
                {
                    let cls = this;
                    let completerName = cls.name + ".compgencompleters.Completer";

                    nit.registerClass.lazy (completerName, function ()
                    {
                        let Completer = nit.defineClass (completerName, "nit.CompgenCompleter");

                        builder.call (cls, Completer);

                        return Completer;
                    });

                    return this;
                })
            ;
        })
    ;
};

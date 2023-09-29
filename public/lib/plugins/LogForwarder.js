module.exports = function (nit)
{
    return nit.definePlugin ("plugins.LogForwarder")
        .field ("[target]", "string", "The property to access the target object which is resposible for logging.", "server")
        .staticMethod ("onUsePlugin", function (hostClass, plugin)
        {
            hostClass
                .do (function ()
                {
                    nit.log.LEVELS.forEach (function (level)
                    {
                        hostClass.method (level, function (message)
                        {
                            var self = this;

                            message = typeof message == "string" ? self.constructor.t (message) : message;

                            nit.invoke ([nit.get (self, plugin.target), level], [message].concat (nit.array (arguments).slice (1)));
                        });
                    });
                })
            ;
        })
    ;
};

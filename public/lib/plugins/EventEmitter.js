module.exports = function (nit)
{
    return nit.definePlugin ("EventEmitter")
        .field ("<events...>", "string", "The event names.")
        .staticMethod ("onUsePlugin", function (hostClass, plugin)
        {
            hostClass
                .defineInnerClass ("EventEmitterListeners", function (EventEmitterListeners)
                {
                    EventEmitterListeners
                        .m ("error.unsupported_event", "The event '%{event}' is not supported.")
                        .staticMethod ("validateEvent", function (event)
                        {
                            if (!~plugin.events.indexOf (event))
                            {
                                this.throw ("error.unsupported_event", { event: event });
                            }
                        })
                        .do (function ()
                        {
                            plugin.events.forEach (function (event)
                            {
                                EventEmitterListeners.property ("$" + event + "...", "function");
                            });
                        })
                        .method ("get", function (event)
                        {
                            EventEmitterListeners.validateEvent (event);

                            return this["$" + event];
                        })
                    ;
                })
                .memo ("listeners", function ()
                {
                    return new hostClass.EventEmitterListeners ();
                })
                .method ("emit", function (event)
                {
                    var self = this;
                    var args = nit.array (arguments).slice (1);
                    var q = nit.Queue ();

                    self.listeners.get (event).forEach (function (l)
                    {
                        q.push (function ()
                        {
                            return l.apply (self, args);
                        });
                    });

                    return q.run (function () { return self; });
                })
                .method ("on", function (event, listener)
                {
                    var self = this;

                    self.listeners.get (event).push (listener);

                    return self;
                })
                .method ("off", function (event, listener)
                {
                    var self = this;

                    nit.arrayRemove (self.listeners.get (event), function (l) { return !listener || l == listener; });

                    return self;
                })
            ;
        })
    ;
};

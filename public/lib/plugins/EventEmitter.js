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
                        .staticMethod ("normalizeEvent", function (event)
                        {
                            return ~event.indexOf (".") ? event : nit.k.v (hostClass, event);
                        })
                        .staticMethod ("validateEvent", function (event)
                        {
                            var k = EventEmitterListeners.normalizeEvent (event);

                            if (!this.fieldMap[k])
                            {
                                this.throw ("error.unsupported_event", { event: event });
                            }

                            return k;
                        })
                        .do (function ()
                        {
                            plugin.events.forEach (function (event)
                            {
                                hostClass.k (event);

                                var k = EventEmitterListeners.normalizeEvent (event);

                                EventEmitterListeners.field (k + "...", "function");
                            });
                        })
                        .method ("get", function (event)
                        {
                            event = EventEmitterListeners.validateEvent (event);

                            return this[event];
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
                .method ("once", function (event, listener)
                {
                    var self = this;

                    function once ()
                    {
                        var args = arguments;
                        var s = this;

                        return nit.Queue ()
                            .push (function ()
                            {
                                return listener.apply (s, args);
                            })
                            .push (function ()
                            {
                                self.off (event, once);
                            })
                            .run ()
                        ;
                    }

                    self.listeners.get (event).push (once);

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

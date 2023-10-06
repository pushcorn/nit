module.exports = function (nit)
{
    return nit.definePlugin ("EventEmitter")
        .field ("<events...>", "string", "The event names.")
        .field ("prePost", "boolean", "Add pre- and post- events.")
        .field ("listenerName", "string", "The listener's class name.", "Listener")
        .onConstruct (function ()
        {
            if (this.prePost)
            {
                var events = this.events;

                events.forEach (function (e)
                {
                    var pce = nit.pascalCase (e);

                    events.push ("pre" + pce, "post" + pce);
                });
            }
        })
        .staticMethod ("onUsePlugin", function (hostClass, plugin)
        {
            var category = nit.pluralize (plugin.listenerName.toLowerCase ());

            hostClass
                .do (function ()
                {
                    plugin.events.forEach (function (event)
                    {
                        hostClass.k (event);
                    });
                })
                .defineInnerPlugin (plugin.listenerName, function (Listener)
                {
                    Listener
                        .categorize (hostClass.name.split (".").slice (0, -1).concat (category).join (".").toLowerCase ())
                        .do (function ()
                        {
                            plugin.events.forEach (function (event)
                            {
                                Listener.lifecycleMethod (event);
                            });
                        })
                    ;
                })
                .defineInnerClass ("Listeners", function (Listeners)
                {
                    Listeners
                        .m ("error.unsupported_event", "The event '%{event}' is not supported.")
                        .staticMethod ("normalizeEvent", function (event)
                        {
                            return ~event.indexOf (".") ? event : nit.k.v (hostClass, event);
                        })
                        .staticMethod ("validateEvent", function (event)
                        {
                            var k = Listeners.normalizeEvent (event);

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
                                var k = Listeners.normalizeEvent (event);

                                Listeners.field (k + "...", "function");
                            });
                        })
                        .method ("get", function (event)
                        {
                            event = Listeners.validateEvent (event);

                            return this[event];
                        })
                    ;
                })
                .memo ("listeners", function ()
                {
                    return new hostClass.Listeners ();
                })
                .method ("emit", function (event)
                {
                    var self = this;
                    var cls = self.constructor;
                    var args = nit.array (arguments).slice (1);
                    var queue = nit.Queue ()
                        .push (function ()
                        {
                            return cls.applyPlugins.apply (cls, [category, event].concat (args));
                        })
                    ;

                    self.listeners.get (event).forEach (function (l)
                    {
                        queue
                            .push (function ()
                            {
                                return l.apply (self, args);
                            })
                        ;
                    });

                    return queue.run (function () { return self; });
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

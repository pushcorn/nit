module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("EventEmitter"))
        .k ("realListener")
        .field ("[events...]", "string", "The event names.")
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
        .onUsedBy (function (hostClass)
        {
            var plugin = this;
            var listenerName = plugin.listenerName;
            var pluginMethod = listenerName.toLowerCase ();
            var category = nit.categoryName (listenerName);
            var Listener;

            hostClass
                .defineInnerPlugin (listenerName, function (cls)
                {
                    var listenerCategory = hostClass.name.split (".").slice (0, -1).concat (category).join (".").toLowerCase ();

                    (Listener = cls).categorize (listenerCategory);
                })
                .staticMethod ("on", function (event, listener)
                {
                    var cls = this;
                    var listenerCls = Listener.defineSubclass (listenerName, true);

                    listenerCls["on" + nit.ucFirst (event)] (listener);

                    return cls[pluginMethod] (new listenerCls);
                })
                .staticLifecycleMethod ("suppressedEmitterError", null, function (error) { nit.log.e (error); })
                .defineInnerClass ("Listeners", function (Listeners)
                {
                    Listeners
                        .m ("error.unsupported_event", "The event '%{event}' is not supported.")
                        .staticMethod ("normalizeEvent", function (event)
                        {
                            event = nit.trim (event);

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
                        .method ("get", function (event)
                        {
                            event = Listeners.validateEvent (event);

                            return this[event];
                        })
                    ;
                })
                .do (function ()
                {
                    plugin.events.forEach (function (event)
                    {
                        plugin.configureEvent (hostClass, event);
                    });
                })
                .memo ("listeners", true, false, function ()
                {
                    return new hostClass.Listeners ();
                })
                .method ("emit", function (event)
                {
                    var self = this;
                    var cls = self.constructor;
                    var args = nit.array (arguments).slice (1);
                    var onError = cls.suppressedEmitterError.bind (self);
                    var listeners = cls.getPlugins (category, false, true).map (function (plugin)
                    {
                        return { t: plugin, m: event };
                    });

                    self.listeners.get (event).forEach (function (l)
                    {
                        listeners.push ({ t: self, m: l });
                    });

                    return nit.invoke.each (listeners, function (l)
                    {
                        return nit.invoke.safe ([l.t, l.m], args, onError);

                    }, self);
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

                        return nit.invoke.after ([s, listener], args, function ()
                        {
                            self.off (event, once);
                        });
                    }

                    self.listeners.get (event).push (nit.dpv (once, Self.kRealListener, listener));

                    return self;
                })
                .method ("off", function (event, listener)
                {
                    var self = this;

                    nit.arrayRemove (self.listeners.get (event), function (l) { return !listener || l == listener || l[Self.kRealListener] == listener; });

                    return self;
                })
            ;
        })
        .method ("addEvent", function (hostClass, event)
        {
            var plugin = this;
            var events = [event];

            if (plugin.prePost)
            {
                var pce = nit.pascalCase (event);

                events.push ("pre" + pce, "post" + pce);
            }

            events.forEach (function (event)
            {
                plugin.events.push (event);
                plugin.configureEvent (hostClass, event);
            });
        })
        .method ("configureEvent", function (hostClass, event)
        {
            var plugin = this;

            hostClass.k (event);
            hostClass[plugin.listenerName].lifecycleMethod (event);

            var Listeners = hostClass.Listeners;
            var k = Listeners.normalizeEvent (event);

            Listeners.field (k + "...", "function");
        })
    ;
};

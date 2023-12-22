module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("LifecycleComponent"))
        .m ("error.component_method_not_defined", "The component method '%{method}' was not defined.")
        .field ("[methods...]", "string", "The component method to be added.")
        .field ("prePost", "boolean", "Define pre- and post- methods.", true)
        .field ("wrapped", "boolean", "Wrap the main method with the pre- and post- methods.", true)
        .field ("instancePluginAllowed", "boolean", "Allow instance level plugins.")
        .field ("pluginName", "string", "The plugin name.")
        .onUsedBy (function (hostClass)
        {
            var plugin = this;
            var prePost = plugin.prePost;
            var sn = hostClass.simpleName;

            hostClass
                .plugin ("event-emitter", { prePost: plugin.prePost, listenerName: sn + "Listener" })
                .plugin ("method-queue", "ComponentMethodQueue")
                .plugin ("logger")
                .do ("ComponentMethodQueue", function (ComponentMethodQueue)
                {
                    ComponentMethodQueue.onSuppressedQueueError (function (owner, error)
                    {
                        owner.error (error);
                    });
                })
                .onSuppressedEmitterError (true, function (error)
                {
                    this.error (error);
                })
                .staticMethod ("defineComponentPlugin", function ()
                {
                    var cls = this;
                    var sc = cls.superclass;
                    var sn = cls.simpleName;
                    var pluginName = plugin.pluginName || sn + "Plugin";
                    var pluginCategory = nit.pluralize (pluginName).toLowerCase ();
                    var ns = nit.kvSplit (cls.name, ".", true)[0];
                    var pluginClass = nit.definePlugin ([ns, pluginName].filter (nit.is.not.empty).join ("."), sc.Plugin && sc.Plugin.name)
                        .defineCaster ("component")
                        .constant ("CATEGORY", pluginCategory)
                        .categorize ([ns, pluginCategory].filter (nit.is.not.empty).join ("."))
                    ;

                    if (!cls.Plugin || cls.Plugin.CATEGORY != pluginCategory)
                    {
                        cls
                            .constant ("Plugin", pluginClass)
                            .registerPlugin (pluginClass, { instancePluginAllowed: plugin.instancePluginAllowed })
                        ;
                    }

                    return cls;
                })
                .defineComponentPlugin ()
                .staticMethod ("addMainStepsToComponentMethodQueue", function (method, Queue)
                {
                    Queue
                        .step (method + ".invokeHook", function (comp)
                        {
                            var cls = comp.constructor;
                            var kHook = cls["k" + nit.ucFirst (method)];

                            return nit.invoke ([comp, cls[kHook]], this.args);
                        })
                        .step (method + ".applyPlugins", function (comp)
                        {
                            var q = this;
                            var cls = comp.constructor;
                            var chain = cls.classChain
                                .filter (function (cls) { return cls.Plugin; })
                                .reverse ()
                                .map (function (cls) { return cls.Plugin.CATEGORY; })
                            ;

                            chain = nit.arrayUnique (chain)
                                .map (function (category)
                                {
                                    return function ()
                                    {
                                        return nit.invoke.return ([plugin.instancePluginAllowed ? comp : cls, cls.applyPlugins], [category, method, comp].concat (q.args));
                                    };
                                })
                            ;

                            return nit.invoke.chain (chain);
                        })
                        .step (method + ".emitEvent", function (comp)
                        {
                            return nit.invoke.silent ([comp, "emit"], [method, comp].concat (this.args));
                        })
                    ;
                })
                .staticMethod ("buildComponentMethodQueue", function (Queue, method, wrapped)
                {
                    var cls = this;
                    var ucMethod = nit.ucFirst (method);
                    var preMethod = "pre" + ucMethod;
                    var postMethod = "post" + ucMethod;

                    Queue.anchors ("preAll");

                    if (wrapped && prePost)
                    {
                        Queue.anchors (preMethod);

                        cls
                            .staticLifecycleMethod (preMethod)
                            .addMainStepsToComponentMethodQueue (preMethod, Queue)
                        ;
                    }

                    Queue.anchors (method);
                    cls.addMainStepsToComponentMethodQueue (method, Queue);

                    if (wrapped && prePost)
                    {
                        Queue.anchors (postMethod);

                        cls
                            .staticLifecycleMethod (postMethod)
                            .addMainStepsToComponentMethodQueue (postMethod, Queue)
                        ;
                    }

                    Queue.anchors ("postAll");
                })
                .staticMethod ("configureComponentMethod", function ()
                {
                    return this.configureComponentMethods.apply (this, arguments);
                })
                .staticTypedMethod ("configureComponentMethods",
                    {
                        methods: "string|array", prePost: "boolean", configurator: "function"
                    }
                    ,
                    function (methods, prePost, configurator /* (Queue, method, mainMethod) */)
                    {
                        var cls = this;

                        nit.each (methods, function (method)
                        {
                            var ucMethod = nit.ucFirst (method);
                            var ms = [method];

                            if (prePost)
                            {
                                ms.unshift ("pre" + ucMethod);
                                ms.push ("post" + ucMethod);
                            }

                            ms.forEach (function (m)
                            {
                                var Queue = cls[nit.ucFirst (m)+ "Queue"] || cls[ucMethod + "Queue"];

                                if (!Queue)
                                {
                                    Self.throw ("error.component_method_not_defined", { method: method });
                                }

                                nit.invoke ([cls, configurator], [Queue, m, method]);
                            });
                        });

                        return cls;
                    }
                )
                .staticTypedMethod ("componentMethod",
                    {
                        method: "string", wrapped: "boolean"
                    },
                    function (method, wrapped)
                    {
                        var cls = this;
                        var eventEmitter = cls.lookupPlugin ("event-emitter");
                        var ucMethod = nit.ucFirst (method);
                        var preMethod = "pre" + ucMethod;
                        var postMethod = "post" + ucMethod;

                        eventEmitter.addEvent (cls, method);
                        wrapped = nit.coalesce (wrapped, plugin.wrapped);

                        return cls
                            .do (function ()
                            {
                                cls.Plugin.lifecycleMethod (method);

                                if (prePost)
                                {
                                    cls.Plugin
                                        .lifecycleMethod (preMethod)
                                        .lifecycleMethod (postMethod)
                                    ;
                                }

                                if (prePost && !wrapped)
                                {
                                    [preMethod, postMethod].forEach (function (method)
                                    {
                                        cls.methodQueue (method, function (Queue)
                                        {
                                            cls.buildComponentMethodQueue (Queue, method);
                                        });
                                    });
                                }
                            })
                            .methodQueue (method, function (Queue)
                            {
                                cls.buildComponentMethodQueue (Queue, method, wrapped);
                            })
                        ;
                    }
                )
                .do (function ()
                {
                    plugin.methods.forEach (function (method)
                    {
                        hostClass.componentMethod (method);
                    });
                })
            ;
        })
    ;
};

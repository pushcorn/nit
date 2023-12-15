module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("LifecycleComponent"))
        .use ("nit.utils.StagedQueue")
        .m ("error.component_method_not_defined", "The component method '%{method}' was not defined.")
        .field ("[methods...]", "string", "The component method to be added.")
        .field ("prePost", "boolean", "Define pre- and post- methods.", true)
        .field ("wrapped", "boolean", "Wrap the main method with the pre- and post- methods.", true)
        .field ("instancePluginAllowed", "boolean", "Allow instance level plugins.")
        .onUsedBy (function (hostClass)
        {
            var plugin = this;
            var sn = hostClass.simpleName;
            var pluginName = sn + "Plugin";
            var prePost = plugin.prePost;
            var pluginCategory = nit.pluralize (pluginName).toLowerCase ();
            var ns = nit.kvSplit (hostClass.name, ".", true)[0];
            var pluginClass = nit.definePlugin ([ns, pluginName].filter (nit.is.not.empty).join ("."))
                .defineCaster ("component")
                .categorize ([ns, pluginCategory].filter (nit.is.not.empty).join ("."))
            ;

            hostClass
                .constant ("Plugin", pluginClass)
                .registerPlugin (pluginClass, { instancePluginAllowed: plugin.instancePluginAllowed })
                .plugin ("event-emitter", { prePost: plugin.prePost, listenerName: sn + "Listener" })
                .plugin ("staged-method")
                .plugin ("logger")
                .staticMethod ("addMainStagesToComponentMethodQueue", function (method, Queue)
                {
                    Queue
                        .stage (method + ".invokeHook", function (comp)
                        {
                            var cls = comp.constructor;
                            var kHook = cls["k" + nit.ucFirst (method)];

                            return nit.invoke ([comp, cls[kHook]], this.args);
                        })
                        .stage (method + ".applyPlugins", function (comp)
                        {
                            var cls = comp.constructor;

                            return nit.invoke.return ([plugin.instancePluginAllowed ? comp : cls, cls.applyPlugins], [pluginCategory, method, comp].concat (this.args));
                        })
                        .stage (method + ".emitEvent", function (comp)
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

                    if (wrapped && prePost)
                    {
                        Queue.stage (preMethod, function () {});

                        cls
                            .lifecycleMethod (preMethod)
                            .addMainStagesToComponentMethodQueue (preMethod, Queue)
                        ;
                    }

                    cls.addMainStagesToComponentMethodQueue (method, Queue);

                    if (wrapped && prePost)
                    {
                        cls
                            .lifecycleMethod (postMethod)
                            .addMainStagesToComponentMethodQueue (postMethod, Queue)
                        ;

                        Queue.stage (postMethod, function () {});
                    }
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
                                pluginClass.lifecycleMethod (method);

                                if (prePost)
                                {
                                    pluginClass
                                        .lifecycleMethod (preMethod)
                                        .lifecycleMethod (postMethod)
                                    ;
                                }

                                if (prePost && !wrapped)
                                {
                                    [preMethod, postMethod].forEach (function (method)
                                    {
                                        cls.stagedMethod (method, function (Queue)
                                        {
                                            cls.buildComponentMethodQueue (Queue, method);
                                        });
                                    });
                                }
                            })
                            .stagedMethod (method, function (Queue)
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

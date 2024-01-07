module.exports = function (nit, Self)
{
    return (Self = nit.definePlugin ("LifecycleComponent"))
        .m ("error.component_method_not_defined", "The component method '%{method}' was not defined.")
        .field ("[methods...]", "string", "The component method to be added.")
        .field ("prePost", "boolean", "Define pre- and post- methods.", true)
        .field ("wrapped", "boolean", "Wrap the main method with the pre- and post- methods.", true)
        .field ("instancePluginAllowed", "boolean", "Allow instance level plugins.")
        .field ("pluginName", "string", "The plugin name.")
        .staticMethod ("addAnchors", function (chain)
        {
            return chain.before ("before").after ("after");
        })
        .onUsedBy (function (hostClass)
        {
            var plugin = this;
            var prePost = plugin.prePost;
            var sn = hostClass.simpleName;

            hostClass
                .plugin ("event-emitter", { prePost: plugin.prePost, listenerName: sn + "Listener" })
                .plugin ("chained-method")
                .plugin ("logger")
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
                .staticMethod ("addCallsToComponentMethod", function (method, chain)
                {
                    chain
                        .after (method + ".invokeHook", function (comp)
                        {
                            var cls = comp.constructor;
                            var kHook = cls["k" + nit.ucFirst (method)];

                            return nit.invoke ([comp, cls[kHook]], this.args);
                        })
                        .after (method + ".applyPlugins", function (comp)
                        {
                            var ctx = this;
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
                                        return nit.invoke.return ([plugin.instancePluginAllowed ? comp : cls, cls.applyPlugins], [category, method, comp].concat (ctx.args));
                                    };
                                })
                            ;

                            return nit.invoke.chain (chain);
                        })
                        .after (method + ".emitEvent", function (comp)
                        {
                            return nit.invoke.silent ([comp, "emit"], [method, comp].concat (this.args));
                        })
                    ;
                })
                .staticMethod ("buildComponentMethod", function (Method, method, wrapped)
                {
                    var cls = this;
                    var eventEmitter = cls.lookupPlugin ("event-emitter");
                    var ucMethod = nit.ucFirst (method);
                    var preMethod = "pre" + ucMethod;
                    var postMethod = "post" + ucMethod;
                    var chain = Method.chains[method];

                    chain.calls = [];
                    chain.after ("before");

                    if (wrapped && prePost)
                    {
                        chain.after (preMethod);

                        cls
                            .staticLifecycleMethod (preMethod)
                            .addCallsToComponentMethod (preMethod, chain)
                        ;
                    }

                    chain.after (method);
                    cls.addCallsToComponentMethod (method, chain);

                    if (wrapped && prePost)
                    {
                        chain.after (postMethod);

                        cls
                            .staticLifecycleMethod (postMethod)
                            .addCallsToComponentMethod (postMethod, chain)
                        ;
                    }

                    chain.after ("after");

                    ["failure", "success", "complete"].forEach (function (cn)
                    {
                        var m = method + nit.ucFirst (cn);

                        cls.lifecycleMethod (m);
                        cls.Plugin.lifecycleMethod (m);
                        eventEmitter.addEvent (cls, m, false);

                        Method.addChain (cn, true);
                        cls.addCallsToComponentMethod (m, Method.chains[cn]);
                        Self.addAnchors (Method.chains[cn]);
                    });

                    Method
                        .link (method, "failure", nit.CallChain.ERROR)
                        .link (method, "success")
                        .link ("failure", "complete")
                        .link ("success", "complete")
                    ;
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
                    function (methods, prePost, configurator /* (Method, method, mainMethod) */)
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
                                var Method = cls[nit.ucFirst (m)+ "ChainedMethod"] || cls[ucMethod + "ChainedMethod"];

                                if (!Method)
                                {
                                    Self.throw ("error.component_method_not_defined", { method: method });
                                }

                                nit.invoke ([cls, configurator], [Method, m, method]);
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
                                        cls.chainedMethod (method, function (Method)
                                        {
                                            cls.buildComponentMethod (Method, method);
                                        });
                                    });
                                }
                            })
                            .chainedMethod (method, function (Method)
                            {
                                cls.buildComponentMethod (Method, method, wrapped);
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

module.exports = function (nit)
{
    var kConfigureQueueFor = "configureQueueFor";

    return nit.definePlugin ("LifecycleComponent")
        .field ("[methods...]", "string", "The component method to be added.")
        .field ("prePost", "boolean", "Define pre- and post- methods.", true)
        .field ("wrapped", "boolean", "Wrap the main method with the pre- and post- methods.", true)
        .field ("instancePlugin", "boolean", "Register instance level plugin.")
        .staticMethod ("onUsePlugin", function (hostClass, plugin)
        {
            var sn = hostClass.simpleName;
            var pluginName = sn + "Plugin";
            var prePost = plugin.prePost;
            var pluginCategory = nit.pluralize (pluginName).toLowerCase ();
            var ns = nit.kvSplit (hostClass.name, ".", true)[0];
            var pluginClass = nit.defineClass ([ns, pluginName].filter (nit.is.not.empty).join ("."))
                .categorize ([ns, pluginCategory].filter (nit.is.not.empty).join ("."))
            ;

            hostClass
                .constant ("Plugin", pluginClass)
                .registerPlugin (pluginClass, { instance: plugin.instancePlugin })
                .plugin ("event-emitter", { prePost: plugin.prePost, listenerName: sn + "Listener" })
                .plugin ("logger")
                .staticClassChainMethod ("initInvocationQueue", true)
                .staticMethod ("createInvocationQueue", function (comp, method, args, wrapped)
                {
                    var cls = comp.constructor;
                    var kHook = cls["k" + nit.ucFirst (method)];
                    var queue = nit.Queue ()
                        .push (method + ".invokeHook", function ()
                        {
                            return nit.invoke ([comp, cls[kHook]], args);
                        })
                        .push (method + ".applyPlugins", function ()
                        {
                            return cls.applyPlugins.apply (plugin.instancePlugin ? comp : cls, [pluginCategory, method, comp].concat (args));
                        })
                        .push (method + ".emitEvent", function ()
                        {
                            return nit.invoke.silent ([comp, "emit"], [method, comp].concat (args));
                        })
                    ;

                    if (wrapped && prePost)
                    {
                        var ucMethod = nit.ucFirst (method);
                        var preMethod = "pre" + ucMethod;
                        var postMethod = "post" + ucMethod;
                        var preQueue = cls.createInvocationQueue (comp, preMethod, args);
                        var postQueue = cls.createInvocationQueue (comp, postMethod, args);

                        queue
                            .lpush (preQueue.tasks)
                            .lpush ("pre", function () {})
                        ;

                        queue
                            .push (postQueue.tasks)
                            .push ("post", function () {})
                        ;
                    }

                    cls.initInvocationQueue (queue, comp, method, args);
                    cls[kConfigureQueueFor + nit.ucFirst (method)] (queue, comp, args);

                    return queue;
                })
                .staticMethod ("invokeComponentMethod", function (comp, method, args)
                {
                    return this.createInvocationQueue (comp, method, args).run ();
                })
                .staticTypedMethod ("componentMethod",
                    {
                        method: "string", impl: "function", wrapped: "boolean"
                    },
                    function (method, impl, wrapped)
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

                                (prePost ? [method, preMethod, postMethod] : [method]).forEach (function (method)
                                {
                                    cls.staticClassChainMethod (kConfigureQueueFor + nit.ucFirst (method), true);
                                });

                                if (prePost)
                                {
                                    [preMethod, postMethod].forEach (function (method)
                                    {
                                        cls.lifecycleMethod (method, function ()
                                        {
                                            var comp = this;

                                            return comp.constructor.invokeComponentMethod (comp, method, nit.array (arguments));
                                        });
                                    });
                                }
                            })
                            .lifecycleMethod (method, function ()
                            {
                                var args = nit.array (arguments);
                                var comp = this;
                                var queue = comp.constructor.createInvocationQueue (comp, method, args, wrapped);

                                return impl ? impl.call (comp, queue, args) : queue.run ();
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

module.exports = function (nit)
{
    return nit.test.defineStrategy ("Plugin")
        .field ("<pluginClass>", "string|function", "The plugin class.")
        .field ("<hostMethod>", "string", "The host method to test.")
        .field ("[isStatic]", "boolean", "Whether the method is a static one.")
        .field ("hostClass", "string|function", "The host class to use.")
        .field ("pluginArgs...", "any", "The plugin constructor args.")
        .field ("hostArgs...", "any", "The host constructor args.")
        .field ("registerPlugin", "boolean", "Whether to register the plugin.")
        .field ("addPlugin", "string", "Whether to add the plugin to the host.")
            .constraint ("choice", "class", "instance")
        .field ("instancePluginAllowed", "boolean", "Whether to allow instance level plugin.")
        .field ("pluginMethod", "string", "The add plugin method.")
        .property ("plugin", "object")
        .property ("host", "object?")
        .property ("hostClassName", "string")

        .onConstruct (function (pluginClass, hostMethod)
        {
            this.pluginClass = pluginClass = nit.is.func (pluginClass)
                ? pluginClass
                : (pluginClass.match (nit.CLASS_NAME_PATTERN) ? nit.lookupClass (pluginClass) : nit.lookupComponent (pluginClass, "plugins"))
            ;

            this.hostClassName = nit.is.func (this.hostClass) ? "" : (this.hostClass || "test.PluginHost");
            this.description = this.description || `Plugin: ${pluginClass.name} => Host.${hostMethod} ()`;
            this.instancePluginAllowed = this.instancePluginAllowed || this.addPlugin == "instance";
            this.pluginMethod = this.pluginMethod || this.pluginClass.simpleName.toLowerCase ();
        })
        .onTestInit (function ()
        {
            this.hostClass = this.hostClassName ? nit.defineClass (this.hostClassName) : this.hostClass;

            if (this.registerPlugin)
            {
                this.hostClass.registerPlugin (this.pluginClass, { instancePluginAllowed: this.instancePluginAllowed });
            }

            this.plugin = new this.pluginClass (...this.pluginArgs);

            if (this.addPlugin == "class")
            {
                this.hostClass[this.pluginMethod] (this.plugin);
            }
            else
            if (!this.addPlugin)
            {
                nit.invoke ([this.plugin, "usedBy"], this.hostClass);
            }
        })
        .onTestUp (function ()
        {
            if (!this.isStatic)
            {
                this.host = new this.hostClass (...this.hostArgs);

                if (this.addPlugin == "instance")
                {
                    this.hostClass[this.pluginMethod].call (this.host, this.plugin);
                }
            }
        })
        .onTest (function ()
        {
            if (this.isStatic)
            {
                return this.hostClass[this.hostMethod] (...arguments);
            }
            else
            {
                return this.host[this.hostMethod] (...arguments);
            }
        })
    ;
};

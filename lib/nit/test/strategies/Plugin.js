module.exports = function (nit)
{
    return nit.test.defineStrategy ("Plugin")
        .field ("<pluginClass>", "string|function", "The plugin class.")
        .field ("<hostMethod>", "string", "The host method to test.")
        .field ("[isStatic]", "boolean", "Whether the method is a static one.")
        .field ("hostClass", "string|function", "The host class to use.")
        .field ("pluginArgs...", "any", "The plugin constructor args.")
        .field ("hostArgs...", "any", "The host constructor args.")
        .field ("registerPlugin", "boolean", "Wheter to register the plugin.")
        .field ("instancePluginAllowed", "boolean", "Wheter to allow instance level plugin.")
        .property ("plugin", "object")
        .property ("host", "object?")
        .property ("hostClassName", "string")

        .onConstruct (function (pluginClass, hostMethod)
        {
            this.pluginClass = pluginClass = nit.lookupClass (pluginClass);
            this.hostClassName = nit.is.func (this.hostClass) ? "" : (this.hostClass || "test.PluginHost");
            this.description = this.description || `Plugin: ${pluginClass.name} => Host.${hostMethod} ()`;
        })
        .onTestInit (function ()
        {
            this.hostClass = this.hostClassName ? nit.defineClass (this.hostClassName) : this.hostClass;

            if (this.registerPlugin)
            {
                this.hostClass.registerPlugin (this.pluginClass, { instancePluginAllowed: this.instancePluginAllowed });
            }

            this.plugin = new this.pluginClass (...this.pluginArgs);

            nit.invoke ([this.plugin, "usedBy"], this.hostClass);
        })
        .onTestUp (function ()
        {
            if (!this.isStatic)
            {
                this.host = new this.hostClass (...this.hostArgs);
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

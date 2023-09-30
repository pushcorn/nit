module.exports = function (nit)
{
    return nit.test.defineStrategy ("Plugin")
        .field ("<pluginClass>", "string|function", "The plugin class.")
        .field ("<hostMethod>", "string", "The host method to test.")
        .field ("[isStatic]", "boolean", "Whether the method is a static one.")
        .field ("hostClass", "string|function", "The host class to use.")
        .field ("pluginArgs...", "any", "The plugin constructor args.")
        .field ("hostArgs...", "any", "The host constructor args.")
        .property ("plugin", "object")
        .property ("host", "object")

        .onConstruct (function (pluginClass, hostMethod)
        {
            this.pluginClass = pluginClass = nit.lookupClass (pluginClass);
            this.hostClass = nit.lookupClass (this.hostClass) || nit.defineClass ("test.PluginHost");
            this.description = this.description || `Plugin: ${pluginClass.name} => Host.${hostMethod} ()`;
        })
        .onTestUp (function ()
        {
            this.plugin = new this.pluginClass (...this.pluginArgs);
            this.pluginClass.onUsePlugin (this.hostClass, this.plugin);

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

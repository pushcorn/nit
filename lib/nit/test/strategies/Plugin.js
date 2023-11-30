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
            this.plugin = new this.pluginClass (...this.pluginArgs);
            this.plugin.usedBy (this.hostClass);
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

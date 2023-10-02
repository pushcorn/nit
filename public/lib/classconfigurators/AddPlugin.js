module.exports = function (nit)
{
    return nit.defineClassConfigurator ("AddPlugin")
        .m ("error.unregistered_plugin", "The class '%{cls.name}' does not support the plugin '%{plugin}'.")
        .field ("<plugin>", "string", "The plugin to add.")
        .field ("[category]", "string", "The plugin category.")
        .field ("options", "any", "The plugin options.")
        .onConfigure (function (cls)
        {
            var self = this;
            var plugin = self.plugin;
            var category = self.category || plugin.split (".").slice (-2, -1)[0];
            var method = nit.singularize (category).toLowerCase ();

            if (!nit.is.func (cls[method]))
            {
                self.throw ("error.unregistered_plugin", { plugin: plugin, cls: cls });
            }

            cls[method] (self.plugin, self.options);
        })
    ;
};

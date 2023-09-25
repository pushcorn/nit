module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.CommandAdapter"))
        .categorize ("commandadapters")
        .constant ("CATEGORY_PATTERN", /\.?commandadapters\..*$/)
        .defineMeta ("category", "string") // The category of the classes to be converted to commands.
        .defineMeta ("prefix", "string") // The command prefix.
        .staticMemoMethod ("registerCommands", function ()
        {
            let cls = this;
            let prefix = cls.prefix ? (nit.kababCase (cls.prefix) + "-") : "";
            let namespace = cls.name.replace (Self.CATEGORY_PATTERN, "").split (".").shift ();

            for (let sourceDescriptor of nit.listComponents (cls.category).filter (d => d.namespace == namespace))
            {
                let name = sourceDescriptor.name;

                if (prefix)
                {
                    let parts = name.split (":");
                    let n = parts.pop ();

                    name = parts.concat (prefix + n).join (":");
                }

                let className = nit.ComponentDescriptor.toClassName (name, "commands");

                nit.registerClass.lazy (className, function ()
                {
                    return cls.buildCommand (className, sourceDescriptor);
                });
            }
        })
        .staticLifecycleMethod ("buildCommand", true, function (className, sourceDescriptor)
        {
            let cls = this;
            let cmdCls = nit.defineClass (className, "nit.Command");

            cls[cls.kBuildCommand] (cmdCls, sourceDescriptor.class);

            return cmdCls;
        })
    ;
};

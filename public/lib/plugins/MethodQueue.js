module.exports = function (nit)
{
    return nit.definePlugin ("MethodQueue")
        .field ("[baseQueueName]", "string", "The name for the method queue base class.", "MethodQueue")
        .onUsedBy (function (hostClass)
        {
            var plugin = this;
            var methodQueueName;

            hostClass
                .defineInnerClass (plugin.baseQueueName, "nit.OrderedQueue", function (cls)
                {
                    methodQueueName = cls.name;
                })
                .staticMethod ("defineMethodQueue", function (isStatic, name, builder)
                {
                    var cls = this;
                    var queueName = nit.ucFirst (name) + "Queue";

                    cls.defineInnerClass (queueName, methodQueueName, function (qc)
                    {
                        nit.invoke ([cls, builder], qc);
                    });

                    hostClass.onDefineSubclass (function (subclass)
                    {
                        subclass.subclassMethodQueue (name);
                    });

                    return cls[isStatic ? "staticLifecycleMethod" : "lifecycleMethod"] (name, function ()
                    {
                        var cls = isStatic ? this : this.constructor;

                        return cls[queueName] (this, { args: arguments }).run ();
                    });
                })
                .staticMethod ("staticMethodQueue", function (name, builder)
                {
                    return this.defineMethodQueue (true, name, builder);
                })
                .staticMethod ("methodQueue", function (name, builder)
                {
                    return this.defineMethodQueue (false, name, builder);
                })
                .staticMethod ("subclassMethodQueue", function (name, builder)
                {
                    var cls = this;
                    var queueName = nit.ucFirst (name) + "Queue";
                    var queueSuperclass = cls.superclass[queueName];

                    return cls.defineInnerClass (queueName, queueSuperclass.name, function (queueSubclas)
                    {
                        nit.invoke (builder, queueSubclas);
                    });
                })
            ;
        })
    ;
};

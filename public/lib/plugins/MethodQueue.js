module.exports = function (nit)
{
    return nit.definePlugin ("MethodQueue")
        .onUsedBy (function (hostClass)
        {
            hostClass
                .staticMethod ("defineMethodQueue", function (isStatic, name, builder)
                {
                    var cls = this;
                    var queueName = nit.ucFirst (name) + "Queue";

                    cls.defineInnerClass (queueName, "nit.OrderedQueue", function (qc)
                    {
                        nit.invoke ([cls, builder], qc);
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
                    var superclass = cls[queueName];

                    return cls.defineInnerClass (queueName, superclass.name, function (subclass)
                    {
                        subclass.tasks = superclass.tasks;
                        subclass.untils = superclass.untils;

                        nit.invoke (builder, subclass);
                    });
                })
            ;
        })
    ;
};

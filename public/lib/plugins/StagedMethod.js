module.exports = function (nit)
{
    return nit.definePlugin ("StagedMethod")
        .onUsedBy (function (hostClass)
        {
            hostClass
                .staticMethod ("defineStagedMethod", function (isStatic, name, builder)
                {
                    var cls = this;
                    var queueName = nit.ucFirst (name) + "Queue";

                    cls.defineInnerClass (queueName, "nit.utils.StagedQueue", function (qc)
                    {
                        nit.invoke ([cls, builder], qc);
                    });

                    return cls[isStatic ? "staticLifecycleMethod" : "lifecycleMethod"] (name, function ()
                    {
                        var cls = isStatic ? this : this.constructor;

                        return cls[queueName] (this, { args: arguments }).run ();
                    });
                })
                .staticMethod ("staticStagedMethod", function (name, builder)
                {
                    return this.defineStagedMethod (true, name, builder);
                })
                .staticMethod ("stagedMethod", function (name, builder)
                {
                    return this.defineStagedMethod (false, name, builder);
                })
                .staticMethod ("extendStagedMethodQueue", function (name, builder)
                {
                    var cls = this;
                    var superclass = cls[name];

                    return cls.defineInnerClass (name, superclass.name, function (subclass)
                    {
                        subclass.stages = superclass.stages;
                        subclass.untils = superclass.untils;

                        nit.invoke (builder, subclass);
                    });
                })
            ;
        })
    ;
};

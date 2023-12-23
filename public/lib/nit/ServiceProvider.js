module.exports = function (nit)
{
    return nit.defineClass ("nit.ServiceProvider")
        .defineMeta ("providedTypes...", "string")
        .categorize ("serviceproviders")
        .staticMethod ("provides", function ()
        {
            this.providedTypes = nit.array (arguments);

            return this;
        })
        .method ("provides", function (type)
        {
            return !!~this.constructor.providedTypes.indexOf (type);
        })
        .lifecycleMethod ("create", true) // (type, ctx) => service
        .lifecycleMethod ("destroy", true) // (service, ctx)
    ;
};

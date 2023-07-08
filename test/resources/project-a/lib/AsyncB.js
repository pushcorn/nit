module.exports = function (nit)
{
    return nit.defineClass ("AsyncB")
        .field ("time")
        .onConstruct (async function ()
        {
            await nit.sleep (10);
            this.time = new Date ().toISOString ();
        })
    ;
};

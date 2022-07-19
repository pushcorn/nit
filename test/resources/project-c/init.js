module.exports = function (nit)
{
    nit
        .preInit (async function ()
        {
            await nit.sleep (10);
            nit.__projectCInitialized = true;
        })
        .postInit (async function ()
        {
            await nit.sleep (10);
            nit.__projectCInitialized = 2;
        })
    ;
};

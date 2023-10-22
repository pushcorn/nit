module.exports = function (nit)
{
    return nit.defineCompgenCompleter ("Demo")
        .registerStringTypeParser ("demo")
        .prioritize (0)
        .completeForType ("demo", async function ()
        {
            await nit.sleep (5);

            return [nit.Compgen.ACTIONS.VALUE, "demo1", "demo2"];
        })
    ;
};

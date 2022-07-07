module.exports = function (nit)
{
    nit.registerArgExpander ("fileAsync", async function (path)
    {
        return await nit.readFileAsync (path);
    });
};

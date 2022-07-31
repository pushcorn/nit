module.exports = function (nit)
{
    nit
        .registerArgExpander ("configFile", function (path)
        {
            return nit.loadConfig (path);
        })
        .registerArgExpander ("file", function (path)
        {
            return nit.readFile (path);
        })
        .registerArgExpander ("fileAsync", async function (path)
        {
            return await nit.readFileAsync (path);
        })
    ;
};




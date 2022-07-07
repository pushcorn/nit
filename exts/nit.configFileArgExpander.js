module.exports = function (nit)
{
    nit.registerArgExpander ("configFile", function (path)
    {
        return nit.loadConfig (path);
    });
};

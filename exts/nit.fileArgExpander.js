module.exports = function (nit)
{
    nit.registerArgExpander ("file", function (path)
    {
        return nit.readFile (path);
    });
};

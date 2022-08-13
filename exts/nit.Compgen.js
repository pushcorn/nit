module.exports = function (nit)
{
    if (nit.COMPLETION_MODE)
    {
        nit.Compgen
            .require ("nit.compgen.completers.File")
            .require ("nit.compgen.completers.Dir")
            .require ("nit.compgen.completers.Choice")
        ;
    }
};

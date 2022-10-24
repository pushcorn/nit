module.exports = function (nit)
{
    return nit.defineClass ("mixins.Loggable")
        .method ("log", function (message, ...args)
        {
            nit.log (this.t (message, ...args));

            return this;
        })
    ;
};

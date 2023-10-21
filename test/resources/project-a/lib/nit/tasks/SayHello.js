module.exports = function (nit)
{
    return nit.defineClass ("nit.tasks.SayHello", "nit.Task")
        .field ("<message>", "string")
        .onRun (function ()
        {
            return `Hello ${this.message}!`;
        })
    ;
};

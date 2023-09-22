module.exports = function (nit, Self)
{
    var writer = new nit.Object.Property.Writer;


    return (Self = nit.defineClass ("nit.utils.Timer"))
        .constant ("MAX_TIMEOUT", 2147483647)
        .field ("<delay>", "integer", "The milliseconds to wait before invoking the callback.")
        .field ("<callback>", "function", "The function to call when the timer fires.")
        .field ("[args...]", "any", "The callback arguments.")
        .property ("timeoutId", "integer", { writer: writer })

        .staticMethod ("set", function (delay, callback) // eslint-disable-line no-unused-vars
        {
            return nit.new (Self, arguments).start ();
        })
        .method ("start", function ()
        {
            var self = this;
            var cls = self.constructor;
            var fireAt = Date.now () + self.delay;
            var deferred = new nit.Deferred;

            function run ()
            {
                var now = Date.now ();

                if (now >= fireAt)
                {
                    return deferred.resolve (self.callback.apply (self, self.args));
                }

                self.timeoutId = writer.value (setTimeout (run, Math.min (fireAt - now, cls.MAX_TIMEOUT)));
            }

            run ();

            return deferred;
        })
        .method ("stop", function ()
        {
            clearTimeout (this.timeoutId);
        })
    ;
};

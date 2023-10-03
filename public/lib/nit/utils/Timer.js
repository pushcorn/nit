module.exports = function (nit, Self)
{
    var writer = new nit.Object.Property.Writer;


    return (Self = nit.defineClass ("nit.utils.Timer"))
        .constant ("MAX_TIMEOUT", 2147483647)
        .m ("error.timer_aborted", "The timer was aborted.")
        .field ("<delay>", "integer", "The milliseconds to wait before invoking the callback.")
        .field ("[callback]", "function", "The function to call when the timer fires.")
        .field ("[args...]", "any", "The callback arguments.")
        .property ("running", "boolean", { writer: writer })
        .property ("result", "Promise", { writer: writer })

        .defineInnerClass ("Runner", function (Runner)
        {
            Runner
                .field ("<timer>", Self.name)
                .property ("deferred", "nit.Deferred")
                .property ("timeoutId", "integer")

                .method ("start", function ()
                {
                    var self = this;
                    var fireAt = Date.now () + self.timer.delay;

                    self.deferred = new nit.Deferred;

                    function run ()
                    {
                        var now = Date.now ();

                        if (now >= fireAt)
                        {
                            self.resolve ();
                        }
                        else
                        {
                            self.timeoutId = setTimeout (run, Math.min (fireAt - now, self.timer.constructor.MAX_TIMEOUT));
                        }
                    }

                    run ();

                    return self;
                })
                .method ("resolve", function ()
                {
                    var self = this;

                    if (self.deferred.resolved)
                    {
                        return self;
                    }

                    try
                    {
                        self.deferred.resolve (nit.invoke ([self.timer, self.timer.callback], self.timer.args));
                    }
                    catch (e)
                    {
                        self.reject (e);
                    }

                    return self;
                })
                .method ("reject", function (e)
                {
                    var self = this;

                    if (self.deferred.resolved)
                    {
                        return self;
                    }

                    self.deferred.reject (e);

                    return self;
                })
                .method ("stop", function ()
                {
                    var self = this;

                    clearTimeout (self.timeoutId);
                    self.timeoutId = 0;

                    return self;
                })
                .method ("cancel", function ()
                {
                    var self = this;

                    self.stop ();
                    self.resolve ();

                    return self;
                })
                .method ("abort", function ()
                {
                    var self = this;

                    self.stop ();
                    self.reject (nit.error.for (self.timer, "error.timer_aborted"));

                    return self;
                })
            ;
        })
        .staticMethod ("set", function (delay, callback) // eslint-disable-line no-unused-vars
        {
            return nit.new (Self, arguments).start ();
        })
        .method ("start", function ()
        {
            var self = this;

            if (self.running)
            {
                return self.result;
            }

            self.running = writer.value (true);

            var runner = new Self.Runner (self).start ();

            self.result = writer.value (runner.deferred.promise
                .finally (function ()
                {
                    self.running = writer.value (false);
                })
            );

            ["stop", "cancel", "abort"].forEach (function (m)
            {
                function method ()
                {
                    self.running = writer.value (false);

                    runner[m] ();

                    return Self.prototype[m].call (self);
                }

                nit.dpv (self, m, method, true);
            });

            return self.result;
        })
        .method ("stop", function ()
        {
            return this.result;
        })
        .method ("cancel", function ()
        {
            return this.result;
        })
        .method ("abort", function ()
        {
            return this.result;
        })
    ;
};

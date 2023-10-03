module.exports = function (nit)
{
    var writer = new nit.Object.Property.Writer;


    return nit.defineClass ("nit.utils.Notifier")
        .field ("[timeout]", "integer", "The notification timeout.", Infinity)
        .property ("timer", "nit.utils.Timer", { writer: writer })
        .method ("listen", function ()
        {
            var self = this;

            if (self.timer)
            {
                self.notify ();
            }

            self.timer = writer.value (new nit.utils.Timer (self.timeout, function () { return self; }));

            return self.timer.start ();
        })
        .method ("stop", function ()
        {
            var self = this;

            nit.invoke ([self.timer, "stop"]);

            return self;
        })
        .method ("notify", function ()
        {
            var self = this;

            nit.invoke ([self.timer, "cancel"]);

            return self;
        })
    ;
};

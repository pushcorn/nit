module.exports = function (nit)
{
    var writer = new nit.Object.Property.Writer;


    return nit.defineClass ("nit.utils.Stopwatch")
        .property ("startTime", "integer", { writer: writer })
        .property ("lapTime", "integer", { writer: writer })
        .property ("laps...", "integer")
        .onPostConstruct (function ()
        {
            this.start ();
        })
        .method ("start", function ()
        {
            var self = this;

            self.startTime = writer.value (Date.now ());
            self.lapTime = writer.value (self.startTime);
            self.laps = [];

            return self;
        })
        .method ("lap", function (message) // eslint-disable-line no-unused-vars
        {
            var self = this;
            var now = Date.now ();
            var elapsed = now - self.lapTime;
            var args = nit.array (arguments);

            self.lapTime = writer.value (now);
            self.laps.push (elapsed);

            nit.log.apply (nit, ["[" + (elapsed / 1000) + "s] Lap " + self.laps.length + (args.length ? ":" : "")].concat (args));

            return self;
        })
        .method ("stop", function (message) // eslint-disable-line no-unused-vars
        {
            var self = this;
            var now = Date.now ();
            var elapsed = now - self.startTime;
            var args = nit.array (arguments);

            nit.log.apply (nit, ["[" + (elapsed / 1000) + "s]" + (args.length ? "" : " Done")].concat (args));

            return self;
        })
    ;
};

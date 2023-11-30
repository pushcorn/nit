module.exports = function (nit, Self)
{
    var writer = new nit.Object.Property.Writer;


    return (Self = nit.definePlugin ("Server"))
        .m ("error.invalid_start_state", "The server cannot be started while it's being stopped.")
        .m ("error.invalid_stop_state", "The server cannot be stopped while it's being started.")
        .staticMethod ("onUsePlugin", function (hostClass)
        {
            hostClass
                .plugin ("lifecycle-component", "start", "stop")
                .property ("state", "string", "stopped",
                {
                    writer: writer,
                    constraints: nit.new ("constraints.Choice", "stopped", "stopping", "starting", "started")
                })
                .property ("startResult", "Promise", { writer: writer, enumerable: false })
                .property ("stopResult", "Promise", { writer: writer, enumerable: false })
                .onConfigureQueueForStart (function (queue, self, args)
                {
                    queue.replace ("start.invokeHook", function ()
                    {
                        if (self.state == "stopping")
                        {
                            Self.throw ("error.invalid_start_state");
                        }

                        if (self.state == "starting" || self.state == "started")
                        {
                            return self.startResult;
                        }

                        var def = new nit.Deferred;
                        var cls = self.constructor;

                        self.state = writer.value ("starting");
                        self.startResult = writer.value (def.promise);

                        nit.invoke.then ([self, cls[cls.kStart]], args, function (e)
                        {
                            if (e)
                            {
                                self.state = writer.value ("stopped");

                                def.reject (e);
                            }
                            else
                            {
                                self.state = writer.value ("started");

                                def.resolve (self);
                            }
                        });

                        return def.promise;
                    });
                })
                .onConfigureQueueForStop (function (queue, self, args)
                {
                    queue.replace ("stop.invokeHook", function ()
                    {
                        if (self.state == "starting")
                        {
                            Self.throw ("error.invalid_stop_state");
                        }

                        if (self.state == "stopping" || self.state == "stopped")
                        {
                            return self.stopResult;
                        }

                        var def = new nit.Deferred;
                        var cls = self.constructor;

                        self.state = writer.value ("stopping");
                        self.stopResult = writer.value (def.promise);

                        nit.invoke.then ([self, cls[cls.kStop]], args, function (e)
                        {
                            if (e)
                            {
                                self.state = writer.value ("started");

                                def.reject (e);
                            }
                            else
                            {
                                self.state = writer.value ("stopped");

                                def.resolve (self);
                            }
                        });

                        return def.promise;
                    });
                })
            ;
        })
    ;
};

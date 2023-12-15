module.exports = function (nit, Self)
{
    var writer = new nit.Object.Property.Writer;


    return (Self = nit.definePlugin ("Server"))
        .m ("error.invalid_start_state", "The server cannot be started while it's being stopped.")
        .m ("error.invalid_stop_state", "The server cannot be stopped while it's being started.")
        .onUsedBy (function (hostClass)
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
                .configureComponentMethods ("start", function (Queue)
                {
                    Queue
                        .after ("preStart", "preStart.returnIfStarted", function (server)
                        {
                            if (server.state == "stopping")
                            {
                                Self.throw ("error.invalid_start_state");
                            }

                            if (server.state == "starting" || server.state == "started")
                            {
                                return this.stop (server.startResult);
                            }
                        })
                        .replace ("start.invokeHook", function (server)
                        {
                            var def = new nit.Deferred;
                            var cls = server.constructor;

                            server.state = writer.value ("starting");
                            server.startResult = writer.value (def.promise);

                            nit.invoke.then ([server, cls[cls.kStart]], this.args, function (e)
                            {
                                if (e)
                                {
                                    server.state = writer.value ("stopped");

                                    def.reject (e);
                                }
                                else
                                {
                                    server.state = writer.value ("started");

                                    def.resolve (server);
                                }
                            });

                            return def.promise;
                        })
                    ;
                })
                .configureComponentMethods ("stop", function (Queue)
                {
                    Queue
                        .after ("preStop", "preStop.returnIfStopped", function (server)
                        {
                            if (server.state == "starting")
                            {
                                Self.throw ("error.invalid_stop_state");
                            }

                            if (server.state == "stopping" || server.state == "stopped")
                            {
                                return this.stop (server.stopResult);
                            }
                        })
                        .replace ("stop.invokeHook", function (server)
                        {
                            var def = new nit.Deferred;
                            var cls = server.constructor;

                            server.state = writer.value ("stopping");
                            server.stopResult = writer.value (def.promise);

                            nit.invoke.then ([server, cls[cls.kStop]], this.args, function (e)
                            {
                                if (e)
                                {
                                    server.state = writer.value ("started");

                                    def.reject (e);
                                }
                                else
                                {
                                    server.state = writer.value ("stopped");

                                    def.resolve (server);
                                }
                            });

                            return def.promise;
                        })
                    ;
                })
            ;
        })
    ;
};

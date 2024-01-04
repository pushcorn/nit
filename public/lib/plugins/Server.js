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
                .configureComponentMethod ("start", function (Method)
                {
                    Method
                        .after ("preStart", "preStart.stopIfStarted", function (server)
                        {
                            if (server.state == "stopping")
                            {
                                Self.throw ("error.invalid_start_state");
                            }

                            if (server.state == "starting" || server.state == "started")
                            {
                                this.stop ();
                            }
                        })
                        .replace ("start.invokeHook", function (server)
                        {
                            var def = new nit.Deferred;
                            var cls = server.constructor;

                            server.state = writer.value ("starting");
                            server.stopResult = writer.value ();
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
                        .afterComplete ("returnServer", function (server)
                        {
                            switch (server.state)
                            {
                                case "starting":
                                    return server.startResult;

                                case "started":
                                    return server;

                                default:
                                    return this.result = null;
                            }
                        })
                    ;
                })
                .configureComponentMethod ("stop", function (Method)
                {
                    Method
                        .after ("preStop", "preStop.stopIfStopped", function (server)
                        {
                            if (server.state == "starting")
                            {
                                Self.throw ("error.invalid_stop_state");
                            }

                            if (server.state == "stopping" || server.state == "stopped")
                            {
                                this.stop ();
                            }
                        })
                        .replace ("stop.invokeHook", function (server)
                        {
                            var def = new nit.Deferred;
                            var cls = server.constructor;

                            server.state = writer.value ("stopping");
                            server.startResult = writer.value ();
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
                        .afterComplete ("returnServer", function (server)
                        {
                            switch (server.state)
                            {
                                case "stopping":
                                    return server.stopResult;

                                case "stopped":
                                    return server;

                                default:
                                    return this.result = null;
                            }
                        })
                    ;
                })
            ;
        })
    ;
};

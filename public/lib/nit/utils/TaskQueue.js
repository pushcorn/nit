module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.utils.TaskQueue"))
        .m ("error.queue_not_started", "The queue was not started.")
        .plugin ("server")
        .defineInnerClass ("Entry", function (Entry)
        {
            Entry
                .field ("<task>", "nit.Task", "The task to run.")
                .field ("[priority]", "integer", "The task priority.", 100)
            ;
        })
        .field ("concurrency", "integer", "The max number of running tasks.", 4)
        .field ("autoStart", "boolean", "Whether to auto-start the queue when enqueue is called.")
        .property ("queuedTasks...", Self.Entry.name)
        .property ("pendingTasks", "object")

        .typedMethod ("enqueue",
            {
                task: "nit.Task", priority: "integer", replace: "boolean"
            },
            function (task, priority, replace)
            {
                var self = this;

                if (self.state != "started")
                {
                    if (self.autoStart)
                    {
                        self.start ();
                    }
                    else
                    {
                        self.throw ("error.queue_not_started");
                    }
                }

                var entry = new Self.Entry (task, priority);

                if (replace)
                {
                    var taskCls = task.constructor;

                    if (nit.arrayReplace (self.queuedTasks, entry, function (e)
                    {
                        if (e.task instanceof taskCls)
                        {
                            e.task.cancel ();

                            return e;
                        }
                    }))
                    {
                        return self;
                    }

                    nit.each (self.pendingTasks, function (pt)
                    {
                        if (pt.entry.task instanceof taskCls)
                        {
                            pt.entry.task.cancel ();

                            return nit.each.STOP;
                        }
                    });
                }

                self.queuedTasks.push (entry);

                nit.sort (self.queuedTasks, "priority");

                return self.next ();
            }
        )
        .method ("next", function ()
        {
            var self = this;
            var entry;

            if ((!self.concurrency || nit.keys (self.pendingTasks).length < self.concurrency)
                && (entry = self.queuedTasks.shift ()))
            {
                var id = nit.uuid ();
                var pt = new nit.Deferred;

                pt.entry = entry;
                self.pendingTasks[id] = pt;

                nit.invoke.then ([entry.task, "run"], null, function (error)
                {
                    if (error)
                    {
                        self.error (error);
                    }

                    delete self.pendingTasks[id];

                    pt.resolve ();
                    self.next ();
                });

                self.next ();
            }

            return self;
        })
        .onStart (function ()
        {
            var self = this;

            self.queuedTasks = [];
            self.pendingTasks = {};
        })
        .onStop (function (graceful)
        {
            var self = this;

            if (!graceful)
            {
                self.queuedTasks = [];
            }

            function stop ()
            {
                var pts = nit.values (self.pendingTasks)
                    .map (function (pt)
                    {
                        pt.entry.task.cancel ();

                        return pt;
                    })
                ;

                if (!nit.is.empty (pts))
                {
                    return nit.invoke.then (nit.parallel, pts, stop);
                }
            }

            return stop ();
        })
    ;
};

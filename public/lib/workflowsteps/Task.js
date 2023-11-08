module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Task")
        .field ("<name>", "string", "The task to execute.")
        .field ("input", "any", "The task input.", "${input}", { exprAllowed: true }) // eslint-disable-line no-template-curly-in-string
        .onRun (function ()
        {
            var self = this;
            var taskCls = nit.lookupComponent (self.name, "tasks", "nit.Task");
            var taskCtx = new taskCls.Context;
            var task = new taskCls (self.input);

            return nit.Queue ()
                .push (function ()
                {
                    return task.execute (taskCtx);
                })
                .push (function ()
                {
                    return taskCtx.result;
                })
            ;
        })
    ;
};

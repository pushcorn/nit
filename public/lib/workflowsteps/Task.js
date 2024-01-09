module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Task")
        .field ("<name>", "string", "The task to run.")
        .field ("input", "any", "The task input.", "${input}", { exprAllowed: true }) // eslint-disable-line no-template-curly-in-string
        .onRun (function (ctx)
        {
            var self = this;
            var taskCls = nit.lookupComponent (self.name, "tasks", "nit.Task");
            var taskCtx = taskCls.Context.new ({ parent: ctx });
            var task = new taskCls (self.input);

            return nit.invoke.return (
                function () { return task.run (taskCtx); },
                undefined,
                function () { return taskCtx.result; }
            );
        })
    ;
};

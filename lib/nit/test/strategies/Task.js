module.exports = function (nit)
{
    return nit.test.defineStrategy ("Task")
        .require ("nit.Task")
        .field ("<task>", "string", "The task to test.")
        .field ("context", "nit.Task.Context", "The context to use.")

        .property ("class", "function")
        .property ("object", "nit.Task")

        .onConstruct (function (task)
        {
            let cls = nit.lookupComponent (task, "tasks");

            this.class = cls;
            this.description = this.description || `Task: ${cls.name}`;
        })
        .onTestUp (async function ()
        {
            this.object = await new this.class (...arguments);
            this.context = this.context || this.class.Context.new ({ task: this.object });
        })
        .onTest (async function ()
        {
            return await this.object.run (this.context);
        })
    ;
};

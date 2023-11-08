module.exports = function (nit, Self)
{
    return (Self = nit.defineCommand ("commands.Workflow"))
        .describe ("Run a workflow.")
        .use ("nit.Workflow")
        .m ("error.workflow_not_found", "The workflow '%{name}' was not found.")
        .defineSubcommand (Subcommand =>
        {
            Subcommand
                .onBuildSubcommand ((Subcommand, Workflow, descriptor) =>
                {
                    Workflow = Workflow || nit.defineWorkflow (nit.ComponentDescriptor.toClassName (descriptor.name, descriptor.category))
                        .config (nit.require (descriptor.path))
                    ;

                    let config = Workflow.config ();

                    Subcommand
                        .describe (config.description)
                        .defineInput (Input =>
                        {
                            Input.import (nit.array (config.options));
                        })
                    ;
                })
                .staticMethod ("lookup", function (name)
                {
                    let cls = this;

                    try
                    {
                        return cls.superclass.lookup.call (cls, name);
                    }
                    catch (e)
                    {
                        let path = nit.absPath (name);

                        if (nit.fs.existsSync (path))
                        {
                            let f = nit.path.parse (path);
                            let className = nit.ComponentDescriptor.toClassName (f.name, cls.subcommandCategory);
                            let descriptor = new nit.ComponentDescriptor (cls.category + "." + nit.pascalCase (f.name), cls.category, { path });

                            return cls.buildSubcommand (className, descriptor);
                        }
                        else
                        {
                            cls.throw ({ code: "error.workflow_not_found", name, cause: e });
                        }
                    }
                })
                .method ("run", async function ()
                {
                    let workflow = new this.component;
                    let input = this.input.toPojo ();

                    return (await workflow.run ({ input })).output;
                })
            ;
        })
        .defineInput (Input => Input.option ("<workflow>", Self.Subcommand.name, "The workflow name or path."))
        .onRun (ctx => ctx.input.workflow.run ())
    ;
};

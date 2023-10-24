module.exports = function (nit, Self, global)
{
    return (Self = nit.defineClass ("nit.Workflow"))
        .k ("context")
        .m ("error.subroutine_not_defined", "The subroutine '%{name}' was not defined.")
        .defineMeta ("exprOpenTag", "string", "${")
        .defineMeta ("exprCloseTag", "string", "}")
        .defineMeta ("globalSource", "string", "global") // The global variable name of that will be used as the source of Context.$.
        .use ("nit.WorkflowField")
        .use ("workflowsteps.Return")
        .staticMethod ("isExpr", function (str)
        {
            return nit.is.str (str)
                && str.slice (0, 2) == Self.exprOpenTag
                && str.slice (-1) == Self.exprCloseTag
            ;
        })
        .staticMethod ("exprToFunc", function (expr)
        {
            return Self.isExpr (expr) ? nit.expr (expr.slice (2, -1)) : function () { return expr; };
        })
        .staticMethod ("field", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            var cls = this;

            nit.new (Self.WorkflowField, arguments).bind (cls.prototype);

            return cls.validatePropertyDeclarations ();
        })
        .defineInnerClass ("Scope", "nit.Class")
        .defineInnerClass ("Evaluator", "nit.Class", "evaluators", function (Evaluator)
        {
            Evaluator
                .m ("error.invalid_expression", "Unable to evaluate the expression '%{expr}'. (Cause: %{cause})")
                .staticMethod ("create", function (expr)
                {
                    if (nit.is.undef (expr))
                    {
                        return;
                    }

                    if (nit.is.str (expr))
                    {
                        return new Self.evaluators.String ({ expr: expr });
                    }

                    if (nit.is.obj (expr))
                    {
                        return new Self.evaluators.Object ({ expr: expr });
                    }

                    if (nit.is.arr (expr))
                    {
                        return new Self.evaluators.Array ({ expr: expr });
                    }

                    return new Self.evaluators.Identity ({ expr: expr });
                })
                .lifecycleMethod ("evaluate", true, function (ctx)
                {
                    var self = this;
                    var cls = self.constructor;

                    try
                    {
                        return cls[cls.kEvaluate].call (self, ctx);
                    }
                    catch (e)
                    {
                        self.throw ("error.invalid_expression", { expr: self.expr, cause: e.message });
                    }
                })
            ;
        })
        .defineEvaluator ("Identity", function (IdentityEvaluator)
        {
            IdentityEvaluator
                .field ("<expr>", "any", "The value to be returned.")
                .onEvaluate (function ()
                {
                    return this.expr;
                })
            ;
        })
        .defineEvaluator ("Object", function (ObjectEvaluator)
        {
            ObjectEvaluator
                .field ("<expr>", "object", "The object to be evaluated.")
                .memo ("entries", function ()
                {
                    return nit.each (this.expr, function (v, k)
                    {
                        return {
                            k: ObjectEvaluator.create (k),
                            v: ObjectEvaluator.create (v)
                        };
                    });
                })
                .onEvaluate (function (ctx)
                {
                    var obj = {};

                    this.entries.forEach (function (e)
                    {
                        obj[e.k.evaluate (ctx)] = e.v.evaluate (ctx);
                    });

                    return obj;
                })
            ;
        })
        .defineEvaluator ("Array", function (ArrayEvaluator)
        {
            ArrayEvaluator
                .field ("<expr...>", "any", "The array to be evaluated.")
                .memo ("entries", function ()
                {
                    return nit.each (this.expr, function (v)
                    {
                        return ArrayEvaluator.create (v);
                    });
                })
                .onEvaluate (function (ctx)
                {
                    return this.entries.map (function (e)
                    {
                        return e.evaluate (ctx);
                    });
                })
            ;
        })
        .defineEvaluator ("String", function (StringEvaluator)
        {
            StringEvaluator
                .field ("<expr>", "string", "The string to be evaluated.")
                .memo ("func", function ()
                {
                    return Self.exprToFunc (this.expr);
                })
                .onEvaluate (function (ctx)
                {
                    return this.func (ctx);
                })
            ;
        })
        .defineInnerClass ("Option", function (Option)
        {
            Option
                .field ("<spec>", "string", "The option spec.")
                .field ("[type]", "string", "The option type.", "string")
                .field ("[description]", "string", "The option description.")
                .field ("[defval]", "any", "The default value.")
            ;
        })
        .defineInnerClass ("Input", "nit.Model", function (Input)
        {
            Input
                .staticProperty ("seq", "integer", 1)
                .staticMethod ("defineRuntimeClass", function (options)
                {
                    var cls = this;

                    options = nit.array (arguments, true);

                    return cls.defineSubclass (cls.name + "$" + cls.seq++)
                        .do (function (cls)
                        {
                            nit.each (options, function (option)
                            {
                                cls.field (option.toPojo ());
                            });
                        })
                        .validatePropertyDeclarations ()
                    ;
                })
            ;
        })
        .defineInnerClass ("Context", function (Context)
        {
            Context
                .staticProperty ("seq", "integer", 1)
                .staticMethod ("new", function ()
                {
                    return nit.assign.apply (nit, [new this].concat (nit.array (arguments)));
                })
                .staticMethod ("defineRuntimeClass", function ()
                {
                    return Context.defineSubclass (Context.name + "$" + Context.seq++);
                })
                .field ("workflow", Self.name, "The workflow.", { enumerable: false })
                .field ("scope", "object", "The scope of the service providers.", function () { return new Self.Scope; })
                .field ("output", "any", "The workflow output.")
                .field ("error", "any", "The workflow error.")
                .getter ("$", true, false, function ()
                {
                    return global[Self.globalSource];
                })
            ;
        })
        .defineInnerClass ("Subroutine", function (Subroutine)
        {
            Subroutine
                .defineInnerClass ("Input", Self.Input.name)
                .defineInnerClass ("Context", Self.Context.name, function (Context)
                {
                    Context
                        .staticProperty ("seq", "integer", 1)
                        .staticMethod ("defineRuntimeClass", function ()
                        {
                            return Context.defineSubclass (Context.name + "$" + Context.seq++);
                        })
                        .field ("caller", Self.Context.name, "The caller context.", { enumerable: false })
                        .delegate ("workflow", "caller.workflow", { enumerable: false })
                    ;
                })
                .field ("<name>", "string", "The name of the subroutine.")
                .field ("<steps...>", "nit.WorkflowStep", "The steps to run.")
                .field ("options...", Self.Option.name, "The subroutine options.")
                .field ("inheritScope", "boolean", "Whether to inherit caller's scope.", true)

                .memo ("inputClass", function ()
                {
                    return Subroutine.Input.defineRuntimeClass (this.options);
                })
                .memo ("contextClass", function ()
                {
                    return Subroutine.Context.defineRuntimeClass ()
                        .field ("input", this.inputClass.name, "The input options.", function () { return {}; })
                    ;
                })
                .method ("run", function (caller)
                {
                    caller = caller instanceof Self.Context ? caller : Self.Context.new (caller);

                    var self = this;
                    var ctx = new self.contextClass ({ caller: caller, scope: self.inheritScope ? caller.scope : new Self.Scope });

                    var queue = nit.Queue ()
                        .stopOn (Self.Return.SIGNAL)
                        .push (function ()
                        {
                            return self.inputClass.validate (ctx.input);
                        })
                    ;

                    self.steps.forEach (function (step)
                    {
                        queue.push (function ()
                        {
                            return step.run (ctx);
                        });
                    });

                    return queue
                        .complete (function ()
                        {
                            return ctx;
                        })
                        .run ()
                    ;
                })
            ;
        })
        .field ("[description]", "string", "The description about the workflow.")
        .field ("[steps...]", "nit.WorkflowStep", "The steps to run.")
        .field ("options...", Self.Option.name, "The workflow option definitions.")
        .field ("subroutines...", Self.Subroutine.name, "The subroutines which can be invoked by another step.")
        .field ("catch", "nit.WorkflowStep", "The step to handle the error.")

        .memo ("inputClass", function ()
        {
            return Self.Input.defineRuntimeClass (this.options);
        })
        .memo ("contextClass", function ()
        {
            return Self.Context.defineRuntimeClass ()
                .field ("input", this.inputClass.name, "The input options.", function () { return {}; })
            ;
        })
        .memo ("subroutineMap", function ()
        {
            return nit.index (this.subroutines, "name");
        })
        .method ("lookupSubroutine", function (name)
        {
            var s = this.subroutineMap[name];

            if (!s)
            {
                this.throw ("error.subroutine_not_defined", { name: name });
            }

            return s;
        })
        .method ("run", function (ctx)
        {
            var self = this;

            ctx = self.contextClass.new (ctx, { workflow: self });

            return nit.Queue ()
                .push (function ()
                {
                    return self.inputClass.validate (ctx.input);
                })
                .push (self.steps.map (function (step)
                {
                    return function ()
                    {
                        return step.run (ctx);
                    };
                }))
                .failure (function (c)
                {
                    if (self.catch)
                    {
                        ctx.error = c.error;

                        return self.catch.run (ctx);
                    }
                    else
                    {
                        nit.dpv (c.error, Self.kContext, ctx, true, false);

                        throw c.error;
                    }
                })
                .complete (function (c)
                {
                    if (c.result != ctx)
                    {
                        ctx.output = nit.coalesce (c.result, ctx.output);
                    }

                    return ctx;
                })
                .run ()
            ;
        })
    ;
};

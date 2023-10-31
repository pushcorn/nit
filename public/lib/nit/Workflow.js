module.exports = function (nit, Self, global)
{
    return (Self = nit.defineClass ("nit.Workflow"))
        .k ("context")
        .m ("error.subroutine_not_defined", "The subroutine '%{name}' was not defined.")
        .use ("nit.WorkflowField")
        .defineInnerClass ("Break")
        .defineInnerClass ("Continue")
        .defineInnerClass ("Return", function (Return)
        {
            Return
                .field ("[value]", "any", "The value to be returned.")
            ;
        })
        .defineInnerClass ("ParentCancellation")
        .constant ("CONTROLS", true,
        {
            Break: new Self.Break,
            Continue: new Self.Continue,
            Return: new Self.Return

        })
        .constant ("CONTROL_TYPES", [Self.Break, Self.Return, Self.Continue])
        .constant ("CANCEL_REASONS", true,
        {
            ParentCancellation: new Self.ParentCancellation
        })
        .defineMeta ("exprOpenTag", "string", "${")
        .defineMeta ("exprCloseTag", "string", "}")

        .staticMethod ("isControl", function (o)
        {
            return !!(o && ~Self.CONTROL_TYPES.indexOf (o.constructor));
        })
        .staticMethod ("isExpr", function (expr)
        {
            if (nit.is.empty (expr))
            {
                return false;
            }

            if (nit.is.str (expr))
            {
                return expr.slice (0, 2) == Self.exprOpenTag && expr.slice (-1) == Self.exprCloseTag;
            }

            if (nit.is.obj (expr))
            {
                return nit.entries (expr).some (function (e)
                {
                    return Self.isExpr (e.k) || Self.isExpr (e.v);
                });
            }

            if (nit.is.arr (expr))
            {
                return expr.some (function (e)
                {
                    return Self.isExpr (e);
                });
            }

            return false;
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
        .defineInnerClass ("Evaluator", "nit.Class", "evaluators", function (Evaluator)
        {
            Evaluator
                .m ("error.invalid_expression", "Unable to evaluate the expression '%{expr}'. (Cause: %{cause})")
                .staticMethod ("create", function (expr)
                {
                    if (!nit.is.empty (expr))
                    {
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
                .field ("[expr]", "any", "The value to be returned.")
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
        .defineInnerClass ("Constraint", function (Constraint)
        {
            Constraint
                .field ("<name>", "string", "The constraint name.")
                .field ("options", "object?", "The constraint options.")
            ;
        })
        .defineInnerClass ("Option", function (Option)
        {
            Option
                .field ("<spec>", "string", "The option spec.")
                .field ("[type]", "string", "The option type.", "string")
                .field ("[description]", "string", "The option description.")
                .field ("[defval]", "any", "The default value.")
                .field ("constraints...", Self.Constraint.name, "The option constraints.")
            ;
        })
        .defineInnerClass ("Input", "nit.Model", function (Input)
        {
            Input
                .staticMethod ("defineRuntimeClass", function (options)
                {
                    var cls = this;

                    options = nit.array (arguments, true);

                    return cls.defineSubclass (cls.name, true)
                        .do (function (cls)
                        {
                            nit.each (options, function (option)
                            {
                                var opt = option.toPojo ();

                                cls.field (nit.omit (opt, "constraints"));

                                opt.constraints.forEach (function (c) { cls.constraint (c.name, c.options); });
                            });
                        })
                        .validatePropertyDeclarations ()
                    ;
                })
            ;
        })
        .defineInnerClass ("Context", "nit.Context", function (Context)
        {
            Context
                .plugin ("event-emitter", "cancel")
                .defineMeta ("globalSource", "string", "global") // The global variable name of that will be used as the source of Context.$.
                .staticMethod ("defineRuntimeClass", function ()
                {
                    return Context.defineSubclass (Context.name, true);
                })
                .field ("workflow", Self.name, "The workflow.")
                .field ("input", "any", "The input data.")
                .field ("output", "any", "The output data.")
                .field ("error", "any", "The workflow error.")
                .field ("canceled", "boolean", "Whether the workflow should be canceled.")
                .property ("cancelReason", "any")
                .getter ("root", false, false, function ()
                {
                    return this[Context.kRoot];
                })
                .memo ("$", false, false, function ()
                {
                    return nit.get (global, this.constructor.globalSource);
                })
                .onConstruct (function ()
                {
                    this.output = nit.coalesce (this.output, this.input);
                })
                .method ("uncancel", function ()
                {
                    var self = this;

                    self.canceled = false;
                    self.cancelReason = undefined;

                    return self;
                })
                .method ("cancel", function (reason)
                {
                    var self = this;

                    self.canceled = true;
                    self.cancelReason = reason;

                    return self.emit ("cancel", self, reason);
                })
            ;
        })
        .defineInnerClass ("Subcontext", Self.Context.name, function (Subcontext)
        {
            Subcontext
                .k ("parentCancelListener")
                .staticMethod ("defineRuntimeClass", function ()
                {
                    return Subcontext.defineSubclass (Subcontext.name, true);
                })
                .field ("[parent]", Self.Context.name, "The parent context.",
                {
                    onLink: function (parent)
                    {
                        var self = this;

                        parent.once ("cancel", self[Subcontext.kParentCancelListener]);

                        self.input = nit.coalesce (self.input, parent.output);
                        self[Subcontext.kParent] = parent;
                    }
                    ,
                    onUnlink: function (parent)
                    {
                        var self = this;

                        parent.off ("cancel", self[Subcontext.kParentCancelListener]);

                        self[Subcontext.kParent] = undefined;
                    }
                })
                .field ("owner", "nit.WorkflowStep|nit.Workflow.Subroutine", "The subcontext owner.")
                .delegate ("workflow", "parent.workflow", false)
                .delegate ("$", "parent.$", false)
                .onConstruct (function (parent)
                {
                    if (!parent)
                    {
                        this.parent = new Self.Context;
                    }
                })
                .memo (Subcontext.kParentCancelListener, true, false, function ()
                {
                    var self = this;

                    return function () { return self.cancel (Self.CANCEL_REASONS.ParentCancellation); };
                })
            ;
        })
        .defineInnerClass ("Subroutine", function (Subroutine)
        {
            Subroutine
                .defineInnerClass ("Input", Self.Input.name)
                .field ("<name>", "string", "The name of the subroutine.")
                .field ("<steps...>", "nit.WorkflowStep", "The steps to run.")
                .field ("options...", Self.Option.name, "The subroutine options.")
                .field ("catch", "nit.WorkflowStep", "The step to handle the error.")

                .memo ("inputClass", function ()
                {
                    return Subroutine.Input.defineRuntimeClass (this.options);
                })
                .memo ("contextClass", function ()
                {
                    return Self.Subcontext.defineRuntimeClass ()
                        .field ("input", this.inputClass.name, "The input options.",
                        {
                            defval: {},
                            localClass: this.inputClass
                        })
                    ;
                })
                .method ("run", function (ctx)
                {
                    var self = this;

                    ctx = ctx instanceof Self.Subcontext ? ctx : self.contextClass.new (ctx);
                    ctx.owner = self;

                    return Self.run (ctx);
                })
            ;
        })
        .field ("[description]", "string", "The description about the workflow.")
        .field ("[steps...]", "nit.WorkflowStep", "The steps to run.")
        .field ("options...", Self.Option.name, "The workflow option definitions.")
        .field ("subroutines...", Self.Subroutine.name, "The subroutines which can be invoked by another step.")
        .field ("catch", "nit.WorkflowStep", "The step to handle the error.")
        .field ("globalSource", "string", "The source of the context's $ property.", "global")

        .staticMethod ("run", function (ctx, owner)
        {
            owner = owner || ctx.owner;

            return nit.Queue ()
                .stopOn (function (c)
                {
                    var control = nit.get (c, "result.output");

                    if (Self.isControl (control))
                    {
                        delete c.result;

                        if (!(control instanceof Self.Continue))
                        {
                            ctx.cancel (control);

                            if (control instanceof Self.Return)
                            {
                                ctx.output = nit.coalesce (control.value, ctx.output);
                            }

                            return true;
                        }
                    }
                })
                .stopOn (function ()
                {
                    return ctx.canceled;
                })
                .push (function ()
                {
                    return owner.inputClass.validate (ctx.input);
                })
                .push (function (c)
                {
                    delete c.result;
                })
                .push (owner.steps.map (function (step)
                {
                    return [
                        function () { return step.run (ctx); },
                        function (c) { ctx.output = nit.coalesce (nit.get (c, "result.output"), ctx.output); }
                    ];
                }))
                .failure (function (c)
                {
                    ctx.error = c.error;

                    if (owner.catch)
                    {
                        return owner.catch.run (ctx);
                    }
                    else
                    {
                        throw ctx.error;
                    }
                })
                .complete (function (c)
                {
                    ctx.output = c.result instanceof Self.Context ? c.result.output : nit.coalesce (c.result, ctx.output);

                    return ctx;
                })
                .run ()
            ;
        })
        .memo ("inputClass", function ()
        {
            return Self.Input.defineRuntimeClass (this.options);
        })
        .memo ("contextClass", function ()
        {
            return Self.Context.defineRuntimeClass ()
                .meta ("globalSource", this.globalSource)
                .field ("input", this.inputClass.name, "The input options.",
                {
                    defval: {},
                    localClass: this.inputClass
                })
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

            ctx = ctx instanceof Self.Context ? ctx : self.contextClass.new (ctx);
            ctx.workflow = self;

            return Self.run (ctx, self);
        })
    ;
};

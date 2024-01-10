module.exports = function (nit, Self)
{
    return (Self = nit.Field.defineSubclass ("nit.WorkflowField"))
        .k ("evaluator", "defaultEvaluator", "set")
        .use ("nit.Workflow")
        .staticMethod ("applyToClass", function (cls)
        {
            return cls.staticMethod ("field", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
            {
                var cls = this;

                nit.new (Self, arguments).bind (cls.prototype);

                return cls.validatePropertyDeclarations ();
            });
        })
        .onPostConstruct (function ()
        {
            var field = this;
            var defval = field.defval;

            nit.dpv (field, Self.kSet, field.set, true, false);

            if (Self.Workflow.isExpr (defval))
            {
                field.defaultEvaluator = Self.Workflow.Evaluator.create (defval);
                field.defval = field.parser.defval;
            }

            field.set = function (value)
            {
                var owner = this;

                if (!owner[Self.kSet]
                    && field.exprAllowed
                    && Self.Workflow.isExpr (value))
                {
                    nit.dpv (owner, field.evaluatorProp, Self.Workflow.Evaluator.create (value), true, false);
                }
                else
                {
                    return field[Self.kSet].call (owner, value);
                }
            };
        })
        .property ("exprAllowed", "boolean")
        .property ("defaultEvaluator", "nit.Workflow.Evaluator")
        .memo ("evaluatorProp", function ()
        {
            return this.privProp + "." + Self.kEvaluator;
        })
        .method ("bind", function (target)
        {
            var field = this;
            var de = field.defaultEvaluator;

            Self.superclass.prototype.bind.call (field, target);

            if (de)
            {
                nit.dpv (target, field.evaluatorProp, de, true, false);
            }

            return field;
        })
        .method ("evaluate", function (owner, ctx)
        {
            var field = this;
            var evaluator = owner[field.evaluatorProp];

            return nit.coalesce (evaluator && evaluator.evaluate (ctx), owner[field.name]);
        })
    ;
};

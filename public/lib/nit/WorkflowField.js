module.exports = function (nit, Self)
{
    return (Self = nit.Field.defineSubclass ("nit.WorkflowField"))
        .k ("evaluator")
        .use ("nit.Workflow")
        .onPostConstruct (function ()
        {
            var field = this;
            var evaluator;

            nit.dpv (field, Self.kSet, field.set, true, false);

            field.set = function (value)
            {
                var owner = this;
                var evaluator;

                if (field.exprAllowed && (evaluator = Self.Workflow.Evaluator.create (value)))
                {
                    nit.dpv (owner, field.evaluatorProp, evaluator, true, false);
                }
                else
                {
                    return field[Self.kSet].call (owner, value);
                }
            };

            if (field.exprAllowed
                && nit.is.str (field.defval)
                && (evaluator = Self.Workflow.Evaluator.create (field.defval)))
            {
                field.defval = function (field, owner)
                {
                    nit.dpv (owner, field.evaluatorProp, evaluator, true, false);

                    return field.parser.defval;
                };
            }
        })
        .property ("exprAllowed", "boolean")
        .memo ("evaluatorProp", function ()
        {
            return this.privProp + "." + Self.kEvaluator;
        })
        .method ("evaluate", function (owner, ctx)
        {
            var field = this;
            var evaluator = owner[field.evaluatorProp];

            if (evaluator)
            {
                return field[Self.kSet].call (owner, evaluator.evaluate (ctx));
            }
        })
    ;
};

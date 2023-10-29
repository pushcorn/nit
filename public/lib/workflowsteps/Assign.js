module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Assign")
        .field ("<key>", "string", "The property key in dot-path format.", { exprAllowed: true })
        .field ("[value]", "any", "The value to be assigned.", "${input}", { exprAllowed: true }) // eslint-disable-line no-template-curly-in-string
        .field ("[mode]", "string", "The assign mode.", "assign")
            .constraint ("choice", "assign", "append", "prepend")

        .onRun (function (ctx)
        {
            var value = this.value;
            var source = nit.get (ctx, this.key);

            switch (this.mode)
            {
                case "append":
                    (source = nit.array (source)).push (value);
                    break;

                case "prepend":
                    (source = nit.array (source)).unshift (value);
                    break;

                default:
                    source = value;
            }

            nit.set (ctx, this.key, source);
        })
    ;
};

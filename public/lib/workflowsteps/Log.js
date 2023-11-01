module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Log")
        .field ("<message>", "any", "The message to log.", "%{input}", { exprAllowed: true }) // eslint-disable-line no-template-curly-in-string
        .field ("[level]", "string", "The log level.")
            .constraint ("choice", "info", "error", "warn", "debug")
        .field ("[timestamp]", "boolean", "Whether to include the timestamp.")

        .onRun (function (ctx)
        {
            var self = this;
            var prefix = "";

            if (self.timestamp)
            {
                prefix += nit.timestamp ().replace ("T", " ") + " ";
            }

            if (self.level)
            {
                prefix += "[" + self.level.toUpperCase () + "] ";
            }

            nit.log (nit.format (prefix + self.message, ctx));
        })
    ;
};
